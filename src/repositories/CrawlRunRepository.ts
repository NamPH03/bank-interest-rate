import { CrawlRun } from "../types/crawl";
import { firestore } from "../config/firebase";
import { createLogger } from "../utils/logger";

const logger = createLogger("CrawlRunRepository");

export class CrawlRunRepository {
  private memoryRuns: CrawlRun[] = [];

  async saveCrawlRun(run: CrawlRun): Promise<string> {
    const runId = run.id || `run_${Date.now()}`;
    const runWithId: CrawlRun = { ...run, id: runId };

    if (firestore) {
      try {
        await firestore.collection("crawlRuns").doc(runId).set({
          ...runWithId,
          startedAt: runWithId.startedAt || new Date(),
          finishedAt: runWithId.finishedAt || new Date(),
        });
        logger.info(`Saved crawl run ${runId} to Firestore [status: ${run.status}]`);
      } catch (error) {
        logger.error(`Failed to save crawl run ${runId} to Firestore`, error);
      }
    }

    this.memoryRuns.push(runWithId);
    return runId;
  }

  async getLatestCrawlRun(): Promise<CrawlRun | null> {
    if (firestore) {
      try {
        const snapshot = await firestore
          .collection("crawlRuns")
          .orderBy("startedAt", "desc")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as Omit<CrawlRun, "id">),
            startedAt: data.startedAt?.toDate?.() || new Date(data.startedAt),
            finishedAt: data.finishedAt?.toDate?.() || new Date(data.finishedAt),
          };
        }
      } catch (error) {
        logger.warn("Could not fetch latest crawl run from Firestore", error);
      }
    }

    return this.memoryRuns[this.memoryRuns.length - 1] || null;
  }
}

export const crawlRunRepository = new CrawlRunRepository();
