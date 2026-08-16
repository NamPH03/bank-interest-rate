import { RateChange } from "./rate";

export type MarketDirection = "UP" | "DOWN" | "STABLE";
export type SignalLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TermChangeSummary {
  termMonths: number;
  direction: MarketDirection;
  banksIncreased: number;
  banksDecreased: number;
  banksUnchanged: number;
  totalBanks: number;
  avgChange: number; // Average absolute percentage point change among changed banks
  maxIncrease?: { bankName: string; from: number; to: number; diff: number };
  maxDecrease?: { bankName: string; from: number; to: number; diff: number };
  changes: RateChange[];
}

export interface SignalAnalysis {
  analyzedAt: Date;
  direction: MarketDirection;
  signalScore: number; // 0 - 100
  trendScore: number; // 0 - 100 (multi-day trend)
  level: SignalLevel;
  totalBanksAudited: number;
  banksChangedCount: number;
  overallAvgChange: number;
  termSummaries: TermChangeSummary[];
  topMovingTerms: TermChangeSummary[];
  isActionable: boolean; // True if exceeds thresholds and suitable for alert
}
