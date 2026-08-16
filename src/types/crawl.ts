export type CrawlStatus = "SUCCESS" | "PARTIAL" | "FAILED";
export type BankCrawlStatus = "SUCCESS" | "FAILED";

export interface BankCrawlResult {
  bankId: string;
  status: BankCrawlStatus;
  ratesCount: number;
  durationMs: number;
  error?: string;
}

export interface CrawlRun {
  id?: string;
  startedAt: Date;
  finishedAt: Date;
  status: CrawlStatus;
  banksSuccess: number;
  banksFailed: number;
  totalRatesCaptured: number;
  bankResults: BankCrawlResult[];
  error?: string;
}
