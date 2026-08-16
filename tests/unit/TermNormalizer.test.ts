import { describe, it, expect } from "vitest";
import { TermNormalizer } from "../../src/services/normalizer/TermNormalizer";

describe("TermNormalizer", () => {
  it("should normalize month strings accurately", () => {
    expect(TermNormalizer.normalize("1 tháng")).toBe(1);
    expect(TermNormalizer.normalize("3 tháng")).toBe(3);
    expect(TermNormalizer.normalize("6 tháng")).toBe(6);
    expect(TermNormalizer.normalize("9 tháng")).toBe(9);
    expect(TermNormalizer.normalize("12 tháng")).toBe(12);
    expect(TermNormalizer.normalize("18 tháng")).toBe(18);
    expect(TermNormalizer.normalize("24 tháng")).toBe(24);
    expect(TermNormalizer.normalize("36 tháng")).toBe(36);
  });

  it("should normalize compact notation (e.g. 6M, 12T)", () => {
    expect(TermNormalizer.normalize("6M")).toBe(6);
    expect(TermNormalizer.normalize("12m")).toBe(12);
    expect(TermNormalizer.normalize("24T")).toBe(24);
    expect(TermNormalizer.normalize("36th")).toBe(36);
  });

  it("should normalize year formats (e.g. 1 năm, 2 năm)", () => {
    expect(TermNormalizer.normalize("1 năm")).toBe(12);
    expect(TermNormalizer.normalize("1.5 năm")).toBe(18);
    expect(TermNormalizer.normalize("2 năm")).toBe(24);
    expect(TermNormalizer.normalize("3 năm")).toBe(36);
  });

  it("should normalize day count formats (e.g. 180 ngày -> 6M, 365 ngày -> 12M)", () => {
    expect(TermNormalizer.normalize("30 ngày")).toBe(1);
    expect(TermNormalizer.normalize("90 ngày")).toBe(3);
    expect(TermNormalizer.normalize("180 ngày")).toBe(6);
    expect(TermNormalizer.normalize("270 ngày")).toBe(9);
    expect(TermNormalizer.normalize("365 ngày")).toBe(12);
    expect(TermNormalizer.normalize("730 ngày")).toBe(24);
  });

  it("should reject non-standard or invalid terms", () => {
    expect(TermNormalizer.normalize("không kỳ hạn")).toBeNull();
    expect(TermNormalizer.normalize("1 tuần")).toBeNull();
    expect(TermNormalizer.normalize("5 tháng")).toBeNull();
    expect(TermNormalizer.normalize("")).toBeNull();
    expect(TermNormalizer.normalize(null as any)).toBeNull();
    expect(TermNormalizer.normalize(undefined as any)).toBeNull();
  });
});
