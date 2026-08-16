import { RawBankRate } from "../../types/rate";
import { DEFAULT_RATE_TYPE } from "../../config/constants";
import { createLogger, Logger } from "../../utils/logger";

export interface BankCrawler {
  readonly bankId: string;
  readonly bankName: string;
  readonly defaultSourceUrl: string;
  readonly defaultRateType: string;
  readonly version: string;

  fetchRates(): Promise<RawBankRate[]>;
}

export abstract class BaseBankCrawler implements BankCrawler {
  abstract readonly bankId: string;
  abstract readonly bankName: string;
  abstract readonly defaultSourceUrl: string;
  readonly defaultRateType: string = DEFAULT_RATE_TYPE;
  readonly version: string = "1.0.0";
  protected logger: Logger;

  constructor() {
    this.logger = createLogger(this.constructor.name);
  }

  abstract fetchRates(): Promise<RawBankRate[]>;
}
