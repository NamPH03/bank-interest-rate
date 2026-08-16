import { RateChange } from "../../types/rate";
import {
  MarketDirection,
  SignalAnalysis,
  SignalLevel,
  TermChangeSummary,
} from "../../types/signal";
import { env } from "../../config/environment";
import { STANDARD_TERMS } from "../../config/constants";
import { alertRepository } from "../../repositories/AlertRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger("SignalEngine");

export class SignalEngine {
  /**
   * Summarize rate changes for each term
   */
  summarizeByTerm(changes: RateChange[], totalBanks: number): TermChangeSummary[] {
    const termMap = new Map<number, RateChange[]>();
    for (const t of STANDARD_TERMS) {
      termMap.set(t, []);
    }

    for (const c of changes) {
      if (termMap.has(c.termMonths)) {
        termMap.get(c.termMonths)!.push(c);
      }
    }

    const summaries: TermChangeSummary[] = [];

    for (const [termMonths, termChanges] of termMap.entries()) {
      let banksIncreased = 0;
      let banksDecreased = 0;
      let banksUnchanged = 0;
      let totalDiff = 0;

      let maxInc: { bankName: string; from: number; to: number; diff: number } | undefined;
      let maxDec: { bankName: string; from: number; to: number; diff: number } | undefined;

      for (const tc of termChanges) {
        if (tc.diffPercentagePoint > 0) {
          banksIncreased++;
          totalDiff += tc.diffPercentagePoint;
          if (!maxInc || tc.diffPercentagePoint > maxInc.diff) {
            maxInc = {
              bankName: tc.bankName,
              from: tc.previousRate,
              to: tc.currentRate,
              diff: tc.diffPercentagePoint,
            };
          }
        } else if (tc.diffPercentagePoint < 0) {
          banksDecreased++;
          totalDiff += Math.abs(tc.diffPercentagePoint);
          if (!maxDec || Math.abs(tc.diffPercentagePoint) > Math.abs(maxDec.diff)) {
            maxDec = {
              bankName: tc.bankName,
              from: tc.previousRate,
              to: tc.currentRate,
              diff: tc.diffPercentagePoint,
            };
          }
        } else {
          banksUnchanged++;
        }
      }

      const totalChanged = banksIncreased + banksDecreased;
      const avgChange = totalChanged > 0 ? Math.round((totalDiff / totalChanged) * 100) / 100 : 0;

      let direction: MarketDirection = "STABLE";
      if (banksIncreased > banksDecreased && banksIncreased >= 2) {
        direction = "UP";
      } else if (banksDecreased > banksIncreased && banksDecreased >= 2) {
        direction = "DOWN";
      }

      summaries.push({
        termMonths,
        direction,
        banksIncreased,
        banksDecreased,
        banksUnchanged,
        totalBanks: termChanges.length || totalBanks,
        avgChange,
        maxIncrease: maxInc,
        maxDecrease: maxDec,
        changes: termChanges,
      });
    }

    return summaries.sort((a, b) => a.termMonths - b.termMonths);
  }

  /**
   * Analyze market-wide signal and calculate signal & trend scores
   */
  analyze(
    changes1d: RateChange[],
    changes3d: RateChange[] = [],
    changes7d: RateChange[] = [],
    totalBanks = 10
  ): SignalAnalysis {
    const termSummaries = this.summarizeByTerm(changes1d, totalBanks);

    // Count distinct banks that changed in 1d
    const changedBankIds = new Set<string>();
    let totalInc = 0;
    let totalDec = 0;
    let sumAbsDiff = 0;

    for (const c of changes1d) {
      if (c.diffPercentagePoint !== 0) {
        changedBankIds.add(c.bankId);
        sumAbsDiff += Math.abs(c.diffPercentagePoint);
        if (c.diffPercentagePoint > 0) totalInc++;
        else totalDec++;
      }
    }

    const banksChangedCount = changedBankIds.size;
    const overallAvgChange =
      changes1d.filter((c) => c.diffPercentagePoint !== 0).length > 0
        ? Math.round(
            (sumAbsDiff / changes1d.filter((c) => c.diffPercentagePoint !== 0).length) * 100
          ) / 100
        : 0;

    // Market direction
    let marketDirection: MarketDirection = "STABLE";
    if (totalInc > totalDec && totalInc >= 3) {
      marketDirection = "UP";
    } else if (totalDec > totalInc && totalDec >= 3) {
      marketDirection = "DOWN";
    }

    // 1. Breadth Score (0 - 40 points)
    const breadthRatio = Math.min(banksChangedCount / totalBanks, 1.0);
    const breadthScore = Math.round(breadthRatio * 40);

    // 2. Magnitude Score (0 - 40 points): normalized against 0.50 pp benchmark
    const magnitudeRatio = Math.min(overallAvgChange / 0.5, 1.0);
    const magnitudeScore = Math.round(magnitudeRatio * 40);

    // 3. Term Alignment / Consensus Score (0 - 20 points)
    // Core benchmark terms: 6M, 12M, 24M
    const coreTerms = termSummaries.filter((t) => [6, 12, 24].includes(t.termMonths));
    const alignedCoreTerms = coreTerms.filter((t) => t.direction === marketDirection && t.direction !== "STABLE").length;
    const termConsensusScore = Math.round((alignedCoreTerms / Math.max(coreTerms.length, 1)) * 20);

    // Total Signal Score (0 - 100)
    const signalScore = Math.min(Math.max(breadthScore + magnitudeScore + termConsensusScore, 0), 100);

    // 4. Trend Score (0 - 100) combining 1d, 3d, 7d momentum
    const bankCount3d = new Set(changes3d.filter((c) => c.diffPercentagePoint !== 0).map((c) => c.bankId)).size;
    const bankCount7d = new Set(changes7d.filter((c) => c.diffPercentagePoint !== 0).map((c) => c.bankId)).size;
    let trendScore = signalScore;
    if (bankCount7d > 0) {
      const acceleration = (banksChangedCount * 0.5 + bankCount3d * 0.3 + bankCount7d * 0.2) / totalBanks;
      trendScore = Math.min(Math.round(acceleration * 100), 100);
    }

    // Signal Level
    let level: SignalLevel = "LOW";
    if (signalScore >= 85) level = "CRITICAL";
    else if (signalScore >= 65) level = "HIGH";
    else if (signalScore >= 40) level = "MEDIUM";

    // Top moving terms (sorted by number of changed banks and avg change)
    const topMovingTerms = [...termSummaries]
      .filter((t) => t.banksIncreased + t.banksDecreased > 0)
      .sort(
        (a, b) =>
          b.banksIncreased + b.banksDecreased - (a.banksIncreased + a.banksDecreased) ||
          b.avgChange - a.avgChange
      );

    // Actionable check
    const isActionable =
      signalScore >= 65 &&
      banksChangedCount >= env.SIGNAL_MIN_BANKS &&
      overallAvgChange >= env.SIGNAL_CHANGE_THRESHOLD &&
      marketDirection !== "STABLE";

    logger.info(
      `Signal Analysis: Score=${signalScore}/100, Trend=${trendScore}/100, Level=${level}, Direction=${marketDirection}, Banks=${banksChangedCount}/${totalBanks}, AvgChange=${overallAvgChange}pp, Actionable=${isActionable}`
    );

    return {
      analyzedAt: new Date(),
      direction: marketDirection,
      signalScore,
      trendScore,
      level,
      totalBanksAudited: totalBanks,
      banksChangedCount,
      overallAvgChange,
      termSummaries,
      topMovingTerms,
      isActionable,
    };
  }

  /**
   * Smart Anti-Spam / Cooldown Check
   * Evaluates if a new alert should be sent or suppressed based on recent alerts within cooldown window
   */
  async shouldSendAlert(analysis: SignalAnalysis): Promise<{ shouldSend: boolean; reason: string }> {
    if (!analysis.isActionable) {
      return {
        shouldSend: false,
        reason: `Signal not actionable (Score ${analysis.signalScore} < 65, or changed banks ${analysis.banksChangedCount} < ${env.SIGNAL_MIN_BANKS})`,
      };
    }

    const recentAlerts = await alertRepository.getRecentAlerts(env.SIGNAL_COOLDOWN_HOURS);
    if (recentAlerts.length === 0) {
      return {
        shouldSend: true,
        reason: `No alerts sent in the last ${env.SIGNAL_COOLDOWN_HOURS} hours. Actionable signal approved.`,
      };
    }

    const lastAlert = recentAlerts[0];

    // Direction flipped (e.g. was DOWN, now UP) -> Send immediately
    if (lastAlert.direction !== analysis.direction) {
      return {
        shouldSend: true,
        reason: `Market direction reversed from ${lastAlert.direction} to ${analysis.direction}. Immediate alert approved.`,
      };
    }

    // Same direction: only send if there is significant new escalation (+0.10 pp higher or >= 2 more banks)
    const scoreDiff = analysis.signalScore - lastAlert.signalScore;
    if (scoreDiff >= 15 || analysis.level === "CRITICAL" && lastAlert.level !== "CRITICAL") {
      return {
        shouldSend: true,
        reason: `Signal strengthened significantly (+${scoreDiff} points / Level ${analysis.level}). Escalation alert approved.`,
      };
    }

    return {
      shouldSend: false,
      reason: `Alert in cooldown window (${env.SIGNAL_COOLDOWN_HOURS}h). Last score ${lastAlert.signalScore}, current ${analysis.signalScore} (change not significant enough to break cooldown).`,
    };
  }
}

export const signalEngine = new SignalEngine();
