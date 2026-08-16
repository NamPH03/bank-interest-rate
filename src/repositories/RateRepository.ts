import { BankRate } from "../types/rate";
import { firestore } from "../config/firebase";
import { createLogger } from "../utils/logger";

const logger = createLogger("RateRepository");

export class RateRepository {
  // In-memory store for fallback/test/local execution
  private memoryRates: BankRate[] = [];

  async saveRates(rates: BankRate[]): Promise<number> {
    if (rates.length === 0) return 0;

    let savedCount = 0;
    if (firestore) {
      try {
        const batch = firestore.batch();
        for (const rate of rates) {
          const docRef = firestore.collection("rates").doc();
          batch.set(docRef, {
            ...rate,
            capturedAt: rate.capturedAt || new Date(),
          });
        }
        await batch.commit();
        savedCount = rates.length;
        logger.info(`Saved ${savedCount} rates to Firestore`);
      } catch (error) {
        logger.error("Failed to save rates to Firestore, falling back to memory store", error);
      }
    }

    // Always keep in memory store as well
    for (const r of rates) {
      this.memoryRates.push({
        ...r,
        id: r.id || `rate_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });
      if (!firestore) savedCount++;
    }

    return savedCount;
  }

  /**
   * Get the latest rate for a given bank and term before a given timestamp
   */
  async getLatestRateBefore(
    bankId: string,
    termMonths: number,
    beforeDate: Date
  ): Promise<BankRate | null> {
    if (firestore) {
      try {
        const snapshot = await firestore
          .collection("rates")
          .where("bankId", "==", bankId)
          .where("termMonths", "==", termMonths)
          .where("capturedAt", "<", beforeDate)
          .orderBy("capturedAt", "desc")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as Omit<BankRate, "id">),
            capturedAt: data.capturedAt?.toDate?.() || new Date(data.capturedAt),
          };
        }
      } catch (error) {
        logger.warn(`Could not query Firestore for ${bankId} term ${termMonths} before ${beforeDate.toISOString()}`, error);
      }
    }

    // Fallback in-memory query
    const matching = this.memoryRates
      .filter(
        (r) =>
          r.bankId === bankId &&
          r.termMonths === termMonths &&
          new Date(r.capturedAt).getTime() < beforeDate.getTime()
      )
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

    return matching[0] || null;
  }

  /**
   * Get all rates captured in the most recent crawl run
   */
  async getLatestRates(): Promise<BankRate[]> {
    if (firestore) {
      try {
        // Query recent rates within the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const snapshot = await firestore
          .collection("rates")
          .where("capturedAt", ">=", oneDayAgo)
          .orderBy("capturedAt", "desc")
          .get();

        if (!snapshot.empty) {
          // Keep only the newest rate per (bankId, termMonths)
          const seen = new Set<string>();
          const latest: BankRate[] = [];

          for (const doc of snapshot.docs) {
            const data = doc.data();
            const key = `${data.bankId}_${data.termMonths}`;
            if (!seen.has(key)) {
              seen.add(key);
              latest.push({
                id: doc.id,
                ...(data as Omit<BankRate, "id">),
                capturedAt: data.capturedAt?.toDate?.() || new Date(data.capturedAt),
              });
            }
          }
          return latest;
        }
      } catch (error) {
        logger.warn("Could not fetch recent rates from Firestore, using memory store", error);
      }
    }

    // Memory store
    const seen = new Set<string>();
    const latest: BankRate[] = [];
    const sorted = [...this.memoryRates].sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );

    for (const r of sorted) {
      const key = `${r.bankId}_${r.termMonths}`;
      if (!seen.has(key)) {
        seen.add(key);
        latest.push(r);
      }
    }

    return latest;
  }

  /**
   * Helper for tests to set historical rate fixtures
   */
  seedMemoryRates(rates: BankRate[]): void {
    this.memoryRates = [...rates];
  }

  getMemoryRates(): BankRate[] {
    return [...this.memoryRates];
  }
}

export const rateRepository = new RateRepository();
