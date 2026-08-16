import { DEFAULT_THRESHOLDS } from "../../config/constants";
import { createLogger } from "../../utils/logger";

const logger = createLogger("RateValidator");

export interface ValidationResult {
  isValid: boolean;
  normalizedRate: number;
  reason?: string;
}

export class RateValidator {
  /**
   * Parse and validate an interest rate value.
   * Handles string formatting: "5.80%", "5,80 %", 5.8
   * Enforces bounds: [0.1, 15.0]
   */
  static validate(
    rawRate: number | string | null | undefined,
    bankId = "unknown",
    termMonths = 0
  ): ValidationResult {
    if (rawRate === null || rawRate === undefined || rawRate === "") {
      return { isValid: false, normalizedRate: 0, reason: "Rate value is null, undefined, or empty" };
    }

    let parsed: number;

    if (typeof rawRate === "number") {
      parsed = rawRate;
    } else {
      // Clean string: replace comma with dot, remove % and spaces
      const clean = rawRate
        .toString()
        .replace(/,/g, ".")
        .replace(/%/g, "")
        .replace(/[\n\r\t]/g, "")
        .trim();

      parsed = parseFloat(clean);
    }

    if (isNaN(parsed) || !isFinite(parsed)) {
      return { isValid: false, normalizedRate: 0, reason: `Rate is not a valid number: '${rawRate}'` };
    }

    // Round to 2 decimal places
    const rounded = Math.round(parsed * 100) / 100;

    // Range checks: [0.1, 15.0]
    if (rounded < DEFAULT_THRESHOLDS.RATE_MIN_VALID) {
      logger.warn(`[${bankId}] Term ${termMonths}M rate ${rounded}% rejected: below minimum ${DEFAULT_THRESHOLDS.RATE_MIN_VALID}%`);
      return { isValid: false, normalizedRate: rounded, reason: `Rate ${rounded} is below minimum allowed` };
    }

    if (rounded > DEFAULT_THRESHOLDS.RATE_MAX_VALID) {
      logger.warn(`[${bankId}] Term ${termMonths}M rate ${rounded}% rejected: above maximum ${DEFAULT_THRESHOLDS.RATE_MAX_VALID}%`);
      return { isValid: false, normalizedRate: rounded, reason: `Rate ${rounded} is above maximum allowed (anomaly/scaled)` };
    }

    return { isValid: true, normalizedRate: rounded };
  }

  /**
   * Check for anomalous jump against previous rate (e.g. > 3.0 percentage point in a single day)
   */
  static checkSanityJump(
    currentRate: number,
    previousRate: number | null,
    bankId = "unknown",
    termMonths = 0
  ): { isSane: boolean; reason?: string } {
    if (previousRate === null) {
      return { isSane: true };
    }

    const diff = Math.abs(currentRate - previousRate);
    if (diff > DEFAULT_THRESHOLDS.RATE_MAX_DAILY_JUMP) {
      logger.warn(
        `[${bankId}] Term ${termMonths}M anomalous jump detected: ${previousRate}% -> ${currentRate}% (diff: ${diff.toFixed(2)} pp > max ${DEFAULT_THRESHOLDS.RATE_MAX_DAILY_JUMP} pp)`
      );
      return {
        isSane: false,
        reason: `Daily jump ${diff.toFixed(2)} pp exceeds max allowed ${DEFAULT_THRESHOLDS.RATE_MAX_DAILY_JUMP} pp`,
      };
    }

    return { isSane: true };
  }
}
