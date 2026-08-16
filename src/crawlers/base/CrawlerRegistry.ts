import { BankCrawler } from "./BankCrawler";
import { createLogger } from "../../utils/logger";

const logger = createLogger("CrawlerRegistry");

export class CrawlerRegistry {
  private crawlers: Map<string, BankCrawler> = new Map();

  register(crawler: BankCrawler): void {
    if (this.crawlers.has(crawler.bankId)) {
      logger.warn(`Overwriting crawler for bank: ${crawler.bankId}`);
    }
    this.crawlers.set(crawler.bankId, crawler);
    logger.debug(`Registered crawler for ${crawler.bankName} (${crawler.bankId})`);
  }

  get(bankId: string): BankCrawler | undefined {
    return this.crawlers.get(bankId);
  }

  getAll(): BankCrawler[] {
    return Array.from(this.crawlers.values());
  }

  getRegisteredBankIds(): string[] {
    return Array.from(this.crawlers.keys());
  }
}

export const crawlerRegistry = new CrawlerRegistry();
