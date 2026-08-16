import axios from "axios";
import { BaseBankCrawler } from "../base/BankCrawler";
import { RawBankRate } from "../../types/rate";

export class VietcombankCrawler extends BaseBankCrawler {
  readonly bankId = "vietcombank";
  readonly bankName = "Vietcombank";
  readonly defaultSourceUrl = "https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json";
  readonly portalUrl = "https://portal.vietcombank.com.vn/Personal/InterestRate/Pages/interest-rate.aspx";

  async fetchRates(): Promise<RawBankRate[]> {
    this.logger.info(`Fetching Vietcombank rates...`);

    const response = await axios.get(this.defaultSourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    const data = response.data?.Data || [];
    const vcbData = data.find((b: any) => b.symbol === "VCB" || b.name?.includes("Vietcombank"));

    if (!vcbData || !vcbData.interestRates) {
      throw new Error("Vietcombank data not found in bank feed");
    }

    const rawRates: RawBankRate[] = [];
    for (const item of vcbData.interestRates) {
      if (item.deposit > 0 && item.value !== null && item.value !== undefined) {
        rawRates.push({
          termRaw: `${item.deposit} tháng`,
          rateRaw: item.value,
          rateType: this.defaultRateType,
          sourceUrl: this.defaultSourceUrl,
        });
      }
    }

    this.logger.info(`Fetched ${rawRates.length} rates for Vietcombank`);
    return rawRates;
  }
}
