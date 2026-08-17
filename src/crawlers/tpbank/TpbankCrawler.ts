import axios from "axios";
import { BaseBankCrawler } from "../base/BankCrawler";
import { RawBankRate } from "../../types/rate";

export class TpbankCrawler extends BaseBankCrawler {
  readonly bankId = "tpbank";
  readonly bankName = "TPBank";
  readonly defaultSourceUrl = "https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json";
  readonly portalUrl = "https://tpb.vn/bieu-lai-suat";

  async fetchRates(): Promise<RawBankRate[]> {
    this.logger.info(`Fetching TPBank rates...`);

    const response = await axios.get(this.defaultSourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      timeout: 10000,
    });

    const data = response.data?.Data || [];
    const bankData = data.find((b: any) => b.symbol === "TPB" || b.name?.includes("TPBank") || b.name?.includes("Tiên Phong"));

    if (!bankData || !bankData.interestRates) {
      throw new Error("TPBank data not found in bank feed");
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

    this.logger.info(`Fetched ${rawRates.length} rates for TPBank`);
    return rawRates;
  }
}
