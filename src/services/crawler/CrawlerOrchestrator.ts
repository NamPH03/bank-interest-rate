import { crawlerRegistry } from "../../crawlers/base/CrawlerRegistry";
import { BankCrawler } from "../../crawlers/base/BankCrawler";
import { BankRate } from "../../types/rate";
import { BankCrawlResult, CrawlRun } from "../../types/crawl";
import { TermNormalizer } from "../normalizer/TermNormalizer";
import { RateValidator } from "../normalizer/RateValidator";
import { bankRepository } from "../../repositories/BankRepository";
import { rateRepository } from "../../repositories/RateRepository";
import { crawlRunRepository } from "../../repositories/CrawlRunRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger("CrawlerOrchestrator");

export interface CrawlExecutionSummary {
  crawlRun: CrawlRun;
  ratesCaptured: BankRate[];
}

export class CrawlerOrchestrator {
  /**
   * Crawl a single bank and validate rates
   */
  async crawlBank(crawler: BankCrawler, runId: string): Promise<{ result: BankCrawlResult; rates: BankRate[] }> {
    const startTime = Date.now();
    logger.info(`[${crawler.bankName}] Starting crawl...`);

    try {
      const rawRates = await crawler.fetchRates();
      const validRates: BankRate[] = [];

      for (const raw of rawRates) {
        const termMonths = TermNormalizer.normalize(raw.termRaw);
        if (termMonths === null) {
          logger.debug(`[${crawler.bankName}] Skipping non-standard term: '${raw.termRaw}'`);
          continue;
        }

        const validation = RateValidator.validate(raw.rateRaw, crawler.bankId, termMonths);
        if (!validation.isValid) {
          logger.warn(`[${crawler.bankName}] Invalid rate rejected: ${raw.rateRaw} (${validation.reason})`);
          continue;
        }

        // Sanity jump check vs previous rate in history
        const prev = await rateRepository.getLatestRateBefore(crawler.bankId, termMonths, new Date());
        const jumpCheck = RateValidator.checkSanityJump(
          validation.normalizedRate,
          prev ? prev.rate : null,
          crawler.bankId,
          termMonths
        );

        if (!jumpCheck.isSane) {
          logger.warn(`[${crawler.bankName}] Anomaly rejected for term ${termMonths}M: ${jumpCheck.reason}`);
          continue;
        }

        validRates.push({
          bankId: crawler.bankId,
          termMonths,
          rate: validation.normalizedRate,
          rateType: raw.rateType || crawler.defaultRateType,
          sourceUrl: raw.sourceUrl || crawler.defaultSourceUrl,
          sourceName: crawler.bankName,
          capturedAt: new Date(),
          crawlerVersion: crawler.version,
          crawlRunId: runId,
        });
      }

      // Deduplicate rates by termMonths (keep latest/highest if duplicates exist)
      const termMap = new Map<number, BankRate>();
      for (const r of validRates) {
        termMap.set(r.termMonths, r);
      }
      const uniqueRates = Array.from(termMap.values());

      const durationMs = Date.now() - startTime;
      logger.info(`[${crawler.bankName}] Finished OK: ${uniqueRates.length} valid rates in ${durationMs}ms`);

      return {
        result: {
          bankId: crawler.bankId,
          status: "SUCCESS",
          ratesCount: uniqueRates.length,
          durationMs,
        },
        rates: uniqueRates,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`[${crawler.bankName}] Crawl failed in ${durationMs}ms`, error);
      return {
        result: {
          bankId: crawler.bankId,
          status: "FAILED",
          ratesCount: 0,
          durationMs,
          error: error.message || "Unknown crawl error",
        },
        rates: [],
      };
    }
  }

  /**
   * Run crawlers for all active banks in parallel with isolation
   */
  async runAll(bankIds?: string[]): Promise<CrawlExecutionSummary> {
    const startedAt = new Date();
    const runId = `run_${startedAt.toISOString().replace(/[-:T.Z]/g, "").substring(0, 14)}`;
    logger.info(`Starting crawl run ${runId}...`);

    const activeBanks = await bankRepository.getAllActiveBanks();
    const activeBankIds = new Set(activeBanks.map((b) => b.id));

    let targetCrawlers = crawlerRegistry.getAll().filter((c) => activeBankIds.has(c.bankId));
    if (bankIds && bankIds.length > 0) {
      targetCrawlers = targetCrawlers.filter((c) => bankIds.includes(c.bankId));
    }

    logger.info(`Executing ${targetCrawlers.length} crawlers in parallel...`);

    const promises = targetCrawlers.map((crawler) => this.crawlBank(crawler, runId));
    const results = await Promise.all(promises);

    const allRates: BankRate[] = [];
    const bankResults: BankCrawlResult[] = [];
    let banksSuccess = 0;
    let banksFailed = 0;

    for (const r of results) {
      bankResults.push(r.result);
      if (r.result.status === "SUCCESS" && r.rates.length > 0) {
        banksSuccess++;
        allRates.push(...r.rates);
      } else {
        banksFailed++;
      }
    }

    // Save rates to repository
    if (allRates.length > 0) {
      await rateRepository.saveRates(allRates);
    }

    const finishedAt = new Date();
    const status = banksFailed === 0 ? "SUCCESS" : banksSuccess > 0 ? "PARTIAL" : "FAILED";

    const crawlRun: CrawlRun = {
      id: runId,
      startedAt,
      finishedAt,
      status,
      banksSuccess,
      banksFailed,
      totalRatesCaptured: allRates.length,
      bankResults,
    };

    await crawlRunRepository.saveCrawlRun(crawlRun);
    logger.info(
      `Crawl run ${runId} completed with status ${status}: ${banksSuccess} success, ${banksFailed} failed, ${allRates.length} total rates saved.`
    );

    return { crawlRun, ratesCaptured: allRates };
  }
}

export const crawlerOrchestrator = new CrawlerOrchestrator();
