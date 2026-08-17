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

export interface MonthlyTrendStats {
  cumulative30dDiff: number; // e.g. +1.50 or -0.80 percentage points over 30 days
  avgCurrentRate: number; // e.g. 5.85%
  avgRate30dAgo: number; // e.g. 4.35%
  direction30d: MarketDirection;
  marketRegime: "LOW_YIELD" | "RISING_CYCLE" | "PEAK_YIELD" | "FALLING_CYCLE";
  financialAdvice: string; // Actionable advice for money allocation / saving strategy
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
  monthlyStats?: MonthlyTrendStats; // 30-day lookback & financial advice
  isActionable: boolean; // True if exceeds thresholds and suitable for alert
}
