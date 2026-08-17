import { crawlerOrchestrator } from "./crawler/CrawlerOrchestrator";
import { changeDetector } from "./analyzer/ChangeDetector";
import { signalEngine } from "./analyzer/SignalEngine";
import { EmailFormatter } from "./notifications/EmailFormatter";
import { emailService } from "./notifications/ResendEmailService";
import { bankRepository } from "../repositories/BankRepository";
import { rateRepository } from "../repositories/RateRepository";
import { createLogger } from "../utils/logger";
import { SignalAnalysis } from "../types/signal";
import { AlertData } from "../types/alert";

const logger = createLogger("RateMonitorService");

export interface MonitorCycleResult {
  runId: string;
  banksAudited: number;
  totalRatesCaptured: number;
  analysis: SignalAnalysis;
  alert?: AlertData;
  emailSent: boolean;
  reason: string;
}

export class RateMonitorService {
  /**
   * Execute one full end-to-end cycle:
   * 1. Crawl all 20 active banks
   * 2. Save rates & audit run
   * 3. Detect changes vs historical data (1d, 3d, 7d, 14d, 30d)
   * 4. Compute Signal, Trend & Monthly Strategy Scores
   * 5. Apply Smart Cooldown / Anti-Spam filters
   * 6. Send Mobile-friendly Alert Email if actionable
   */
  async runCycle(targetBankIds?: string[]): Promise<MonitorCycleResult> {
    logger.info("================ STARTING MONITOR CYCLE ================");

    // Step 1: Crawl
    const crawlSummary = await crawlerOrchestrator.runAll(targetBankIds);
    const currentRates = crawlSummary.ratesCaptured;

    if (currentRates.length === 0) {
      logger.warn("No rates were captured in this cycle. Aborting analysis.");
      return {
        runId: crawlSummary.crawlRun.id!,
        banksAudited: 0,
        totalRatesCaptured: 0,
        analysis: signalEngine.analyze([], [], [], 20),
        emailSent: false,
        reason: "Crawl captured 0 rates",
      };
    }

    // Step 2: Detect changes across multi-day & 30-day windows
    const multiChanges = await changeDetector.detectMultiWindowChanges(currentRates);
    const activeBanks = await bankRepository.getAllActiveBanks();
    const bankNames = activeBanks.map((b) => b.shortName);

    // Step 3: Compute signal, trend & 30-day cumulative stats
    const analysis = signalEngine.analyze(
      multiChanges.changes1d,
      multiChanges.changes3d,
      multiChanges.changes7d,
      activeBanks.length,
      multiChanges.changes14d,
      multiChanges.changes30d
    );

    // Step 4: Evaluate Cooldown & Anti-Spam
    const decision = await signalEngine.shouldSendAlert(analysis);
    let emailSent = false;
    let alertData: AlertData | undefined;

    if (decision.shouldSend) {
      logger.info(`🚨 ACTIONABLE SIGNAL DETECTED! Proceeding to notify... (${decision.reason})`);
      alertData = EmailFormatter.format(analysis, bankNames);
      const sendResult = await emailService.sendAlert(alertData);
      emailSent = sendResult.success;
    } else {
      logger.info(`ℹ️ Alert not sent. Reason: ${decision.reason}`);
    }

    logger.info("================ MONITOR CYCLE COMPLETED ================\n");

    return {
      runId: crawlSummary.crawlRun.id!,
      banksAudited: activeBanks.length,
      totalRatesCaptured: currentRates.length,
      analysis,
      alert: alertData,
      emailSent,
      reason: decision.reason,
    };
  }

  /**
   * Run standalone analysis on currently stored rates without triggering a new crawl
   */
  async analyzeCurrentRates(): Promise<SignalAnalysis> {
    const latestRates = await rateRepository.getLatestRates();
    const multiChanges = await changeDetector.detectMultiWindowChanges(latestRates);
    const activeBanks = await bankRepository.getAllActiveBanks();
    return signalEngine.analyze(
      multiChanges.changes1d,
      multiChanges.changes3d,
      multiChanges.changes7d,
      activeBanks.length,
      multiChanges.changes14d,
      multiChanges.changes30d
    );
  }
}

export const rateMonitorService = new RateMonitorService();
