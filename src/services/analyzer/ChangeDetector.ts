import { BankRate, RateChange } from "../../types/rate";
import { rateRepository } from "../../repositories/RateRepository";
import { bankRepository } from "../../repositories/BankRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ChangeDetector");

export interface MultiWindowChanges {
  changes1d: RateChange[];
  changes3d: RateChange[];
  changes7d: RateChange[];
  changes14d: RateChange[];
  changes30d: RateChange[];
}

export class ChangeDetector {
  /**
   * Detects changes between the latest rates and historical rates captured before a specific date.
   */
  async detectChanges(
    currentRates: BankRate[],
    windowDays = 1
  ): Promise<RateChange[]> {
    const changes: RateChange[] = [];
    const windowDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const activeBanks = await bankRepository.getAllActiveBanks();
    const bankNameMap = new Map(activeBanks.map((b) => [b.id, b.shortName]));

    for (const cur of currentRates) {
      // Find the most recent historical rate for this bank & term before the window threshold
      const targetDate = windowDays > 0 ? windowDate : (cur.capturedAt ? new Date(new Date(cur.capturedAt).getTime() - 1000) : windowDate);
      const prev = await rateRepository.getLatestRateBefore(
        cur.bankId,
        cur.termMonths,
        targetDate
      );

      if (prev && prev.rate !== undefined) {
        const diff = Math.round((cur.rate - prev.rate) * 100) / 100;
        const bankName = bankNameMap.get(cur.bankId) || cur.bankId;

        changes.push({
          bankId: cur.bankId,
          bankName,
          termMonths: cur.termMonths,
          currentRate: cur.rate,
          previousRate: prev.rate,
          diffPercentagePoint: diff,
          capturedAt: cur.capturedAt,
          previousCapturedAt: prev.capturedAt,
        });

        if (diff !== 0) {
          logger.debug(
            `[Change ${windowDays}d] ${bankName} ${cur.termMonths}M: ${prev.rate}% -> ${cur.rate}% (${diff > 0 ? "+" : ""}${diff} pp)`
          );
        }
      }
    }

    return changes;
  }

  /**
   * Calculate changes across 1-day, 3-day, 7-day, 14-day, and 30-day lookbacks
   */
  async detectMultiWindowChanges(currentRates: BankRate[]): Promise<MultiWindowChanges> {
    const [changes1d, changes3d, changes7d, changes14d, changes30d] = await Promise.all([
      this.detectChanges(currentRates, 1),
      this.detectChanges(currentRates, 3),
      this.detectChanges(currentRates, 7),
      this.detectChanges(currentRates, 14),
      this.detectChanges(currentRates, 30),
    ]);

    return { changes1d, changes3d, changes7d, changes14d, changes30d };
  }
}

export const changeDetector = new ChangeDetector();
