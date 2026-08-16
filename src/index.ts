import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import "./crawlers"; // Auto-registers crawlers
import { rateMonitorService } from "./services/monitor";
import { createLogger } from "./utils/logger";

const logger = createLogger("CloudFunctions");

/**
 * Scheduled Cloud Function running daily at 08:00 AM (Vietnam Time UTC+7)
 * Cron: '0 8 * * *' (Asia/Ho_Chi_Minh)
 */
export const dailyRateMonitor = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    memory: "512MiB",
    timeoutSeconds: 300,
    retryCount: 1,
  },
  async (event) => {
    logger.info(`Starting daily scheduled crawl at ${event.scheduleTime}...`);
    try {
      const result = await rateMonitorService.runCycle();
      logger.info("Daily rate monitor completed successfully", result);
    } catch (error) {
      logger.error("Daily rate monitor encountered an error", error);
      throw error;
    }
  }
);

/**
 * Manual HTTP Trigger for testing / webhooks
 */
export const manualTrigger = onRequest(
  {
    cors: false,
    timeoutSeconds: 180,
  },
  async (req, res) => {
    logger.info("Received manual HTTP trigger request");
    try {
      const result = await rateMonitorService.runCycle();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Manual trigger failed", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
);
