import axios from "axios";
import { BaseBankCrawler } from "../base/BankCrawler";
import { RawBankRate } from "../../types/rate";

export class SacombankCrawler extends BaseBankCrawler {
  readonly bankId = "sacombank";
  readonly bankName = "Sacombank";
  readonly defaultSourceUrl = "https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json";
  readonly portalUrl = "https://www.sacombank.com.vn";

  async fetchRates(): Promise<RawBankRate[]> {
    this.logger.info(`Fetching Sacombank rates...`);

    const response = await axios.get(this.defaultSourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      timeout: 10000,
    });

    const data = response.data?.Data || [];
    const bankData = data.find((b: any) => b.symbol === "STB" || b.name?.includes("Sacombank"));

    if (!bankData || !bankData.interestRates) {
      throw new Error("Sacombank data not found in bank feed");
    }

    const rawRates: RawBankRate[] = [];
    for (const item of bankData.interestRates) {
      if (item.deposit > 0 && item.value !== null && item.value !== undefined) {
        rawRates.push({
          termRaw: `${item.deposit} tháng`,
          rateRaw: item.value,
          rateType: this.defaultRateType,
          sourceUrl: this.defaultSourceUrl,
        });
      }
    }

    this.logger.info(`Fetched ${rawRates.length} rates for Sacombank`);
    return rawRates;
  }
}
