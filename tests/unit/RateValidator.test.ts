import { describe, it, expect } from "vitest";
import { RateValidator } from "../../src/services/normalizer/RateValidator";

describe("RateValidator", () => {
  it("should validate and parse regular numeric rates", () => {
    const res = RateValidator.validate(5.8);
    expect(res.isValid).toBe(true);
    expect(res.normalizedRate).toBe(5.8);
  });

  it("should validate and parse string formats with comma or percent", () => {
    expect(RateValidator.validate("5.80%").normalizedRate).toBe(5.8);
    expect(RateValidator.validate("5,80 %").normalizedRate).toBe(5.8);
    expect(RateValidator.validate("  6.15 % /năm  ").normalizedRate).toBe(6.15);
  });

  it("should reject anomalies and scaled values like 580% or -3%", () => {
    expect(RateValidator.validate(580).isValid).toBe(false);
    expect(RateValidator.validate(-3).isValid).toBe(false);
    expect(RateValidator.validate(0).isValid).toBe(false); // below min 0.1%
    expect(RateValidator.validate(18.5).isValid).toBe(false); // above max 15.0%
  });

  it("should reject invalid/null/empty values", () => {
    expect(RateValidator.validate(null).isValid).toBe(false);
    expect(RateValidator.validate(undefined).isValid).toBe(false);
    expect(RateValidator.validate("").isValid).toBe(false);
    expect(RateValidator.validate("abc").isValid).toBe(false);
  });

  it("should detect anomalous daily jump (> 3.0 percentage point in 1 day)", () => {
    const normalJump = RateValidator.checkSanityJump(6.1, 5.8);
    expect(normalJump.isSane).toBe(true);

    const anomalousJump = RateValidator.checkSanityJump(9.5, 5.5);
    expect(anomalousJump.isSane).toBe(false);
  });
});
