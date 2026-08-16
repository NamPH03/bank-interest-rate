import axios from "axios";
import { BaseBankCrawler } from "../base/BankCrawler";
import { RawBankRate } from "../../types/rate";

export class TechcombankCrawler extends BaseBankCrawler {
  readonly bankId = "techcombank";
  readonly bankName = "Techcombank";
  readonly defaultSourceUrl = "https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json";
  readonly portalUrl = "https://techcombank.com/cong-cu-tien-ich/bieu-phi-lai-suat";

  async fetchRates(): Promise<RawBankRate[]> {
    this.logger.info(`Fetching Techcombank rates...`);

    const response = await axios.get(this.defaultSourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    const data = response.data?.Data || [];
    const tcbData = data.find((b: any) => b.symbol === "TCB" || b.name?.includes("Techcombank"));

    if (!tcbData || !tcbData.interestRates) {
      throw new Error("Techcombank data not found in bank feed");
    }

    const rawRates: RawBankRate[] = [];
    for (const item of tcbData.interestRates) {
      if (item.deposit > 0 && item.value !== null && item.value !== undefined) {
        rawRates.push({
          termRaw: `${item.deposit} tháng`,
          rateRaw: item.value,
          rateType: this.defaultRateType,
          sourceUrl: this.defaultSourceUrl,
        });
      }
    }

    this.logger.info(`Fetched ${rawRates.length} rates for Techcombank`);
    return rawRates;
  }
}
