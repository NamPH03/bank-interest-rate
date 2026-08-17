import { describe, it, expect } from "vitest";
import { SignalEngine } from "../../src/services/analyzer/SignalEngine";
import { RateChange } from "../../src/types/rate";

describe("SignalEngine", () => {
  const engine = new SignalEngine();

  it("should ignore weak signals (e.g. 1/10 banks increase 0.05%)", () => {
    const changes: RateChange[] = [
      {
        bankId: "techcombank",
        bankName: "Techcombank",
        termMonths: 6,
        currentRate: 5.85,
        previousRate: 5.8,
        diffPercentagePoint: 0.05,
        capturedAt: new Date(),
        previousCapturedAt: new Date(),
      },
    ];

    const analysis = engine.analyze(changes, [], [], 10);
    expect(analysis.isActionable).toBe(false);
    expect(analysis.level).toBe("LOW");
    expect(analysis.signalScore).toBeLessThan(40);
  });

  it("should detect HIGH / CRITICAL actionable signals (e.g. 8/10 banks increase +0.25% average)", () => {
    const bankIds = ["vcb", "tcb", "bidv", "ctg", "agb", "mbb", "vpb", "acb"];
    const changes: RateChange[] = [];

    for (const id of bankIds) {
      changes.push({
        bankId: id,
        bankName: id.toUpperCase(),
        termMonths: 6,
        currentRate: 6.05,
        previousRate: 5.8,
        diffPercentagePoint: 0.25,
        capturedAt: new Date(),
        previousCapturedAt: new Date(),
      });
      changes.push({
        bankId: id,
        bankName: id.toUpperCase(),
        termMonths: 12,
        currentRate: 6.3,
        previousRate: 6.0,
        diffPercentagePoint: 0.3,
        capturedAt: new Date(),
        previousCapturedAt: new Date(),
      });
    }

    const analysis = engine.analyze(changes, [], [], 10);
    expect(analysis.isActionable).toBe(true);
    expect(analysis.direction).toBe("UP");
    expect(analysis.banksChangedCount).toBe(8);
    expect(analysis.overallAvgChange).toBeGreaterThanOrEqual(0.25);
    expect(["HIGH", "CRITICAL"]).toContain(analysis.level);
    expect(analysis.signalScore).toBeGreaterThanOrEqual(65);
  });

  it("should calculate 30-day cumulative trend and produce actionable money allocation advice", () => {
    const changes30d: RateChange[] = [
      {
        bankId: "vietcombank",
        bankName: "Vietcombank",
        termMonths: 12,
        currentRate: 6.8,
        previousRate: 5.0,
        diffPercentagePoint: 1.8,
        capturedAt: new Date(),
        previousCapturedAt: new Date(),
      },
      {
        bankId: "techcombank",
        bankName: "Techcombank",
        termMonths: 12,
        currentRate: 7.0,
        previousRate: 5.2,
        diffPercentagePoint: 1.8,
        capturedAt: new Date(),
        previousCapturedAt: new Date(),
      },
    ];

    const analysis = engine.analyze([], [], [], 20, [], changes30d);
    expect(analysis.monthlyStats).toBeDefined();
    expect(analysis.monthlyStats?.cumulative30dDiff).toBe(1.8);
    expect(analysis.monthlyStats?.avgCurrentRate).toBe(6.9);
    expect(analysis.monthlyStats?.avgRate30dAgo).toBe(5.1);
    expect(analysis.monthlyStats?.direction30d).toBe("UP");
    expect(analysis.monthlyStats?.marketRegime).toBe("PEAK_YIELD");
    expect(analysis.monthlyStats?.financialAdvice).toContain("ĐỈNH HẤP DẪN");
  });
});
