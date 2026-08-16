import { describe, it, expect } from "vitest";
import { EmailFormatter } from "../../src/services/notifications/EmailFormatter";
import { SignalAnalysis } from "../../src/types/signal";

describe("EmailFormatter", () => {
  it("should format email subject and body correctly with objective tone", () => {
    const mockAnalysis: SignalAnalysis = {
      analyzedAt: new Date("2026-08-16T08:00:00Z"),
      direction: "UP",
      signalScore: 87,
      trendScore: 82,
      level: "HIGH",
      totalBanksAudited: 10,
      banksChangedCount: 8,
      overallAvgChange: 0.27,
      termSummaries: [],
      topMovingTerms: [
        {
          termMonths: 6,
          direction: "UP",
          banksIncreased: 8,
          banksDecreased: 0,
          banksUnchanged: 2,
          totalBanks: 10,
          avgChange: 0.27,
          changes: [],
        },
        {
          termMonths: 12,
          direction: "UP",
          banksIncreased: 7,
          banksDecreased: 0,
          banksUnchanged: 3,
          totalBanks: 10,
          avgChange: 0.31,
          changes: [],
        },
      ],
      isActionable: true,
    };

    const alert = EmailFormatter.format(mockAnalysis, ["Vietcombank", "Techcombank", "BIDV"]);

    expect(alert.emailSubject).toContain("📈 Cảnh báo: Lãi suất ngân hàng đang tăng đồng loạt");
    expect(alert.emailBodyText).toContain("MẶT BẰNG LÃI SUẤT ĐANG TĂNG");
    expect(alert.emailBodyText).toContain("8/10 ngân hàng");
    expect(alert.emailBodyText).toContain("Kỳ hạn 6 tháng");
    expect(alert.emailBodyText).toContain("+0.27 điểm %");
    expect(alert.emailBodyText).toContain("Signal Score: 87/100 (HIGH)");
    expect(alert.emailBodyHtml).toContain("SIGNAL SCORE");
    expect(alert.emailBodyHtml).toContain("87");
  });
});
