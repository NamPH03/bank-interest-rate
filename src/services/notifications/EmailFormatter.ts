import { SignalAnalysis } from "../../types/signal";
import { AlertData } from "../../types/alert";

export class EmailFormatter {
  static format(analysis: SignalAnalysis, bankNames: string[] = []): AlertData {
    const isUp = analysis.direction === "UP";
    const dirEmoji = isUp ? "📈" : "📉";
    const dirVerb = isUp ? "tăng" : "giảm";
    const dirCapital = isUp ? "TĂNG" : "GIẢM";

    const subject = `${dirEmoji} Cảnh báo: Lãi suất ngân hàng đang ${dirVerb} đồng loạt (${analysis.banksChangedCount}/${analysis.totalBanksAudited} ngân hàng)`;

    const dateStr = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(analysis.analyzedAt);

    // Text format
    let text = `MẶT BẰNG LÃI SUẤT ĐANG ${dirCapital}\n\n`;
    text += `${analysis.banksChangedCount}/${analysis.totalBanksAudited} ngân hàng được theo dõi vừa ${dirVerb} lãi suất trong 24 giờ qua.\n\n`;

    for (const term of analysis.topMovingTerms) {
      const arrow = term.direction === "UP" ? "↑" : term.direction === "DOWN" ? "↓" : "→";
      const changed = term.banksIncreased + term.banksDecreased;
      text += `* Kỳ hạn ${term.termMonths} tháng:\n`;
      text += `  + Biến động: ${term.avgChange > 0 ? (isUp ? "+" : "-") : ""}${term.avgChange.toFixed(2)} điểm %\n`;
      text += `  + Số ngân hàng thay đổi: ${changed}/${term.totalBanks} ngân hàng ${arrow}\n\n`;
    }

    text += `Signal Score: ${analysis.signalScore}/100 (${analysis.level})\n`;
    text += `Trend Score: ${analysis.trendScore}/100\n`;
    text += `Thời điểm ghi nhận: ${dateStr}\n\n`;

    if (bankNames.length > 0) {
      text += `Nguồn dữ liệu đối chiếu: ${bankNames.join(", ")}\n\n`;
    }

    text += `---\nLưu ý: Thông tin mang tính chất theo dõi dữ liệu thị trường khách quan, không phải khuyến nghị đầu tư tài chính.`;

    // HTML format (Mobile responsive, clear cards, clean typography)
    let termRowsHtml = "";
    for (const term of analysis.topMovingTerms) {
      const color = term.direction === "UP" ? "#16a34a" : term.direction === "DOWN" ? "#dc2626" : "#6b7280";
      const arrow = term.direction === "UP" ? "↑" : term.direction === "DOWN" ? "↓" : "—";
      const changed = term.banksIncreased + term.banksDecreased;

      termRowsHtml += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: 600; color: #1f2937;">Kỳ hạn ${term.termMonths} tháng</td>
          <td style="padding: 12px 8px; font-weight: 700; color: ${color};">${isUp ? "+" : "-"}${term.avgChange.toFixed(2)} điểm %</td>
          <td style="padding: 12px 8px; color: #4b5563;">${changed}/${term.totalBanks} NH ${arrow}</td>
        </tr>
      `;
    }

    const badgeColor =
      analysis.level === "CRITICAL"
        ? "#991b1b"
        : analysis.level === "HIGH"
        ? "#dc2626"
        : analysis.level === "MEDIUM"
        ? "#d97706"
        : "#2563eb";

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #111827;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background-color: ${isUp ? "#065f46" : "#7f1d1d"}; padding: 24px 20px; color: #ffffff;">
      <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Hệ thống Giám sát Lãi suất Ngân hàng</div>
      <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
        ${dirEmoji} MẶT BẰNG LÃI SUẤT ĐANG ${dirCapital}
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">
        <strong>${analysis.banksChangedCount}/${analysis.totalBanksAudited} ngân hàng</strong> vừa ${dirVerb} lãi suất trong 24 giờ qua.
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 20px;">
      
      <!-- Key Scores -->
      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 12px; color: #64748b; font-weight: 600;">SIGNAL SCORE</div>
          <div style="font-size: 24px; font-weight: 800; color: ${badgeColor};">${analysis.signalScore}<span style="font-size: 14px; font-weight: 400; color: #94a3b8;">/100</span></div>
          <div style="font-size: 11px; font-weight: 700; color: ${badgeColor};">${analysis.level}</div>
        </div>
        <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 12px; color: #64748b; font-weight: 600;">TREND SCORE</div>
          <div style="font-size: 24px; font-weight: 800; color: #334155;">${analysis.trendScore}<span style="font-size: 14px; font-weight: 400; color: #94a3b8;">/100</span></div>
          <div style="font-size: 11px; color: #64748b;">Xu hướng đa ngày</div>
        </div>
      </div>

      <!-- Term Breakdown Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #374151;">Chi tiết biến động theo kỳ hạn:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left;">
            <th style="padding: 10px 8px; color: #4b5563; font-weight: 600;">Kỳ hạn</th>
            <th style="padding: 10px 8px; color: #4b5563; font-weight: 600;">Biến động TB</th>
            <th style="padding: 10px 8px; color: #4b5563; font-weight: 600;">Độ phủ</th>
          </tr>
        </thead>
        <tbody>
          ${termRowsHtml}
        </tbody>
      </table>

      <!-- Meta Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px; font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 16px;">
        <div><strong>Thời điểm ghi nhận:</strong> ${dateStr}</div>
        <div><strong>Loại lãi suất chuẩn hoá:</strong> Tiền gửi trực tuyến VND (Online Standard)</div>
      </div>

      <!-- Disclaimer -->
      <div style="font-size: 11px; color: #9ca3af; line-height: 1.4; border-top: 1px solid #e5e7eb; padding-top: 12px;">
        Lưu ý: Dữ liệu được thu thập và phân tích tự động nhằm mục đích hỗ trợ cá nhân theo dõi biến động thị trường. Không cấu thành lời khuyên đầu tư hoặc tư vấn tài chính.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return {
      alertType: isUp ? "MARKET_INCREASE" : "MARKET_DECREASE",
      direction: analysis.direction,
      signalScore: analysis.signalScore,
      trendScore: analysis.trendScore,
      level: analysis.level,
      summary: `${analysis.banksChangedCount}/${analysis.totalBanksAudited} ngân hàng vừa ${dirVerb} lãi suất (Signal: ${analysis.signalScore}/100)`,
      termHighlights: analysis.topMovingTerms,
      emailSubject: subject,
      emailBodyText: text,
      emailBodyHtml: html,
      emailSent: false,
      createdAt: new Date(),
    };
  }
}
