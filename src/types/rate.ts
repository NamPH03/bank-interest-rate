export interface RawBankRate {
  termRaw: string; // e.g. "6 tháng", "180 ngày", "6M"
  rateRaw: number | string; // e.g. 5.8 or "5.80" or "5,80%"
  rateType?: string; // e.g. "online_standard"
  sourceUrl: string;
}

export interface BankRate {
  id?: string;
  bankId: string;
  termMonths: number; // 1, 3, 6, 9, 12, 18, 24, 36
  rate: number; // e.g. 5.80 (%/năm, 2 decimal places)
  rateType: string; // "online_standard"
  sourceUrl: string;
  sourceName: string;
  capturedAt: Date;
  crawlerVersion: string;
  crawlRunId?: string;
}

export interface RateChange {
  bankId: string;
  bankName: string;
  termMonths: number;
  currentRate: number;
  previousRate: number;
  diffPercentagePoint: number; // e.g. +0.30 or -0.20
  capturedAt: Date;
  previousCapturedAt: Date;
}
