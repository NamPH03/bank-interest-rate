import { Command } from "commander";
import "./crawlers"; // Auto-registers crawlers
import { crawlerOrchestrator } from "./services/crawler/CrawlerOrchestrator";
import { changeDetector } from "./services/analyzer/ChangeDetector";
import { signalEngine } from "./services/analyzer/SignalEngine";
import { rateMonitorService } from "./services/monitor";
import { EmailFormatter } from "./services/notifications/EmailFormatter";
import { emailService } from "./services/notifications/ResendEmailService";
import { bankRepository } from "./repositories/BankRepository";
import { rateRepository } from "./repositories/RateRepository";
import { createLogger } from "./utils/logger";

const logger = createLogger("CLI");
const program = new Command();

program
  .name("bank-rate-monitor")
  .description("Vietnam Bank Interest Rate Monitor & Alert System")
  .version("1.0.0");

program
  .command("seed-banks")
  .description("Seed initial 20 banks into database")
  .action(async () => {
    logger.info("Seeding initial banks...");
    await bankRepository.seedInitialBanks();
    logger.info("Done.");
  });

program
  .command("crawl")
  .description("Run bank rate crawlers")
  .option("-b, --banks <banks...>", "Specific bank IDs to crawl (e.g. vietcombank techcombank)")
  .action(async (options) => {
    logger.info("Starting crawler job...", options);
    const result = await crawlerOrchestrator.runAll(options.banks);

    console.log("\n=================== CRAWL RESULTS ===================");
    console.log(`Status: ${result.crawlRun.status}`);
    console.log(`Success: ${result.crawlRun.banksSuccess} | Failed: ${result.crawlRun.banksFailed}`);
    console.log(`Total rates captured: ${result.ratesCaptured.length}`);
    console.log("-----------------------------------------------------");

    for (const res of result.crawlRun.bankResults) {
      console.log(
        `- [${res.bankId.toUpperCase()}] ${res.status} (${res.ratesCount} rates, ${res.durationMs}ms) ${
          res.error ? `Error: ${res.error}` : ""
        }`
      );
    }

    console.log("\nSample Rates Captured:");
    for (const r of result.ratesCaptured.slice(0, 15)) {
      console.log(
        `  ${r.bankId.padEnd(14)} | Term: ${r.termMonths.toString().padStart(2)}M | Rate: ${r.rate.toFixed(2)}% | Source: ${r.sourceUrl}`
      );
    }
    console.log("=====================================================\n");
  });

program
  .command("analyze")
  .description("Analyze market rates, detect changes and calculate signal score")
  .action(async () => {
    logger.info("Running market analysis on latest rates...");
    const latestRates = await rateRepository.getLatestRates();

    if (latestRates.length === 0) {
      console.log("⚠️ No rates found in database. Please run 'npm run crawl' first.");
      return;
    }

    const multiChanges = await changeDetector.detectMultiWindowChanges(latestRates);
    const activeBanks = await bankRepository.getAllActiveBanks();
    const analysis = signalEngine.analyze(
      multiChanges.changes1d,
      multiChanges.changes3d,
      multiChanges.changes7d,
      activeBanks.length,
      multiChanges.changes14d,
      multiChanges.changes30d
    );

    console.log("\n=================== MARKET SIGNAL ANALYSIS ===================");
    console.log(`Direction:    ${analysis.direction}`);
    console.log(`Signal Score: ${analysis.signalScore}/100 [${analysis.level}]`);
    console.log(`Trend Score:  ${analysis.trendScore}/100`);
    console.log(`Banks Changed: ${analysis.banksChangedCount}/${analysis.totalBanksAudited}`);
    console.log(`Average Diff:  ${analysis.overallAvgChange.toFixed(2)} percentage point`);
    console.log(`Actionable:    ${analysis.isActionable ? "YES (Alert Threshold Met)" : "NO (Below Threshold / Stable)"}`);
    console.log("--------------------------------------------------------------");

    if (analysis.monthlyStats) {
      console.log("30-Day Monthly Cumulative Trend:");
      console.log(`  - Biến động 30 ngày: ${analysis.monthlyStats.cumulative30dDiff > 0 ? "+" : ""}${analysis.monthlyStats.cumulative30dDiff.toFixed(2)} pp`);
      console.log(`  - Lãi suất TB hiện tại: ${analysis.monthlyStats.avgCurrentRate.toFixed(2)}% (30 ngày trước: ${analysis.monthlyStats.avgRate30dAgo.toFixed(2)}%)`);
      console.log(`  - GỢI Ý CHIẾN LƯỢC TIỀN GỬI: ${analysis.monthlyStats.financialAdvice}`);
      console.log("--------------------------------------------------------------");
    }

    console.log("Term Breakdown:");
    for (const t of analysis.termSummaries) {
      const arrow = t.direction === "UP" ? "↑" : t.direction === "DOWN" ? "↓" : "—";
      console.log(
        `  - ${t.termMonths.toString().padStart(2)} Tháng: ${t.banksIncreased} tăng, ${t.banksDecreased} giảm, ${t.banksUnchanged} giữ nguyên (${arrow} TB: ${t.avgChange.toFixed(2)} pp)`
      );
    }
    console.log("==============================================================\n");
  });

program
  .command("notify")
  .description("Trigger notification evaluation and send email if threshold met (or dry run)")
  .option("-f, --force", "Force send email ignoring thresholds")
  .action(async (options) => {
    logger.info("Evaluating notification triggers...", options);
    const latestRates = await rateRepository.getLatestRates();
    const multiChanges = await changeDetector.detectMultiWindowChanges(latestRates);
    const activeBanks = await bankRepository.getAllActiveBanks();
    const bankNames = activeBanks.map((b) => b.shortName);

    const analysis = signalEngine.analyze(
      multiChanges.changes1d,
      multiChanges.changes3d,
      multiChanges.changes7d,
      activeBanks.length,
      multiChanges.changes14d,
      multiChanges.changes30d
    );

    if (options.force) {
      analysis.isActionable = true;
      console.log("⚠️ Forced mode active: bypassing thresholds.");
    }

    const decision = await signalEngine.shouldSendAlert(analysis);
    console.log(`\nDecision: ${decision.shouldSend ? "SEND ALERT" : "SUPPRESS ALERT"}`);
    console.log(`Reason:   ${decision.reason}\n`);

    if (decision.shouldSend || options.force) {
      const alert = EmailFormatter.format(analysis, bankNames);
      await emailService.sendAlert(alert);
    }
  });

program
  .command("run-once")
  .description("Execute full automated cycle: Crawl -> Analyze -> Cooldown Check -> Notify")
  .action(async () => {
    logger.info("Running full automated cycle...");
    const result = await rateMonitorService.runCycle();

    console.log("\n=================== RUN-ONCE SUMMARY ===================");
    console.log(`Run ID:              ${result.runId}`);
    console.log(`Rates Captured:      ${result.totalRatesCaptured}`);
    console.log(`Market Direction:    ${result.analysis.direction}`);
    console.log(`Signal Score:        ${result.analysis.signalScore}/100 (${result.analysis.level})`);
    console.log(`Email Sent:          ${result.emailSent}`);
    console.log(`Engine Decision:     ${result.reason}`);
    console.log("========================================================\n");
  });

program
  .command("healthcheck")
  .description("Check system dependencies and database status")
  .action(async () => {
    logger.info("Performing healthcheck...");
    const banks = await bankRepository.getAllActiveBanks();
    const rates = await rateRepository.getLatestRates();
    console.log(`\n✅ System Healthy`);
    console.log(`Active Banks Configured: ${banks.length}`);
    console.log(`Rates in current state:  ${rates.length}\n`);
  });

program.parse(process.argv);
