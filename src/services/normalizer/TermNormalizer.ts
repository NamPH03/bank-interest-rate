import { STANDARD_TERMS } from "../../config/constants";

export class TermNormalizer {
  /**
   * Normalizes raw term string into standard termMonths (1, 3, 6, 9, 12, 18, 24, 36)
   * Returns null if term is non-standard or cannot be recognized.
   */
  static normalize(raw: string | number): number | null {
    if (typeof raw === "number") {
      return STANDARD_TERMS.includes(raw) ? raw : null;
    }

    if (!raw || typeof raw !== "string") {
      return null;
    }

    const clean = raw
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\n\r\t]/g, "");

    // Direct patterns:
    // 1. "12 tháng", "12 thang", "12m", "12 t", "12th"
    const monthMatch = clean.match(/^(\d{1,2})\s*(tháng|thang|m|t|month|months|th)\b/);
    if (monthMatch) {
      const months = parseInt(monthMatch[1], 10);
      return STANDARD_TERMS.includes(months) ? months : null;
    }

    // 2. "1 năm", "2 nam", "1.5 year", "3 years"
    const yearMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(năm|nam|year|years|y)\b/);
    if (yearMatch) {
      const years = parseFloat(yearMatch[1]);
      const months = Math.round(years * 12);
      return STANDARD_TERMS.includes(months) ? months : null;
    }

    // 3. "180 ngày", "365 ngay", "30 days"
    const dayMatch = clean.match(/^(\d+)\s*(ngày|ngay|day|days|d)\b/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1], 10);
      if (days >= 25 && days <= 35) return 1;
      if (days >= 80 && days <= 100) return 3;
      if (days >= 170 && days <= 195) return 6;
      if (days >= 260 && days <= 285) return 9;
      if (days >= 355 && days <= 375) return 12;
      if (days >= 530 && days <= 560) return 18;
      if (days >= 710 && days <= 745) return 24;
      if (days >= 1070 && days <= 1115) return 36;
      return null;
    }

    // 4. Exact numbers only e.g. "6", "12"
    if (/^\d+$/.test(clean)) {
      const numOnly = parseInt(clean, 10);
      if (STANDARD_TERMS.includes(numOnly)) {
        return numOnly;
      }
    }

    return null;
  }
}
