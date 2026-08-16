import { describe, it, expect, beforeEach } from "vitest";
import { ChangeDetector } from "../../src/services/analyzer/ChangeDetector";
import { rateRepository } from "../../src/repositories/RateRepository";
import { BankRate } from "../../src/types/rate";

describe("ChangeDetector", () => {
  let detector: ChangeDetector;

  beforeEach(() => {
    detector = new ChangeDetector();
  });

  it("should calculate exact percentage point difference (e.g. 5.50 -> 5.80 = +0.30)", async () => {
    const historicalDate = new Date("2026-08-15T08:00:00Z");
    const currentDate = new Date("2026-08-16T08:00:00Z");

    const previousRates: BankRate[] = [
      {
        bankId: "techcombank",
        termMonths: 6,
        rate: 5.5,
        rateType: "online_standard",
        sourceUrl: "https://example.com",
        sourceName: "Techcombank",
        capturedAt: historicalDate,
        crawlerVersion: "1.0.0",
      },
      {
        bankId: "vietcombank",
        termMonths: 12,
        rate: 5.5,
        rateType: "online_standard",
        sourceUrl: "https://example.com",
        sourceName: "Vietcombank",
        capturedAt: historicalDate,
        crawlerVersion: "1.0.0",
      },
    ];

    rateRepository.seedMemoryRates(previousRates);

    const currentRates: BankRate[] = [
      {
        bankId: "techcombank",
        termMonths: 6,
        rate: 5.8,
        rateType: "online_standard",
        sourceUrl: "https://example.com",
        sourceName: "Techcombank",
        capturedAt: currentDate,
        crawlerVersion: "1.0.0",
      },
      {
        bankId: "vietcombank",
        termMonths: 12,
        rate: 5.5, // Unchanged
        rateType: "online_standard",
        sourceUrl: "https://example.com",
        sourceName: "Vietcombank",
        capturedAt: currentDate,
        crawlerVersion: "1.0.0",
      },
    ];

    const changes = await detector.detectChanges(currentRates, 1);
    expect(changes.length).toBe(2);

    const tcbChange = changes.find((c) => c.bankId === "techcombank");
    expect(tcbChange).toBeDefined();
    expect(tcbChange!.diffPercentagePoint).toBe(0.3); // +0.30 percentage points

    const vcbChange = changes.find((c) => c.bankId === "vietcombank");
    expect(vcbChange).toBeDefined();
    expect(vcbChange!.diffPercentagePoint).toBe(0); // 0 no change
  });
});
