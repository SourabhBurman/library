import {
  calculateBorrowDays,
  calculateOrderAmount,
  calculateReturnRefund,
  daysBetween,
} from "./pricing";
import { TRANSACTION_TYPE } from "../enums";
import { SECURITY_PERCENT, PENALTY_PERCENT } from "./constant";

describe("daysBetween", () => {
  it("counts whole days regardless of time-of-day", () => {
    const morning = new Date("2026-01-01T08:00:00");
    const lateNight = new Date("2026-01-03T23:59:00");
    expect(daysBetween(morning, lateNight)).toBe(2);
  });

  it("is negative when the second date is earlier", () => {
    expect(daysBetween(new Date("2026-01-05"), new Date("2026-01-01"))).toBe(
      -4,
    );
  });
});

describe("calculateBorrowDays", () => {
  const now = new Date("2026-01-01T00:00:00");

  it("defaults to 1 day when no return date is given", () => {
    expect(calculateBorrowDays(undefined, now)).toBe(1);
  });

  it("counts the days until the requested return date", () => {
    expect(calculateBorrowDays("2026-01-08", now)).toBe(7);
  });

  it("throws if the return date is today", () => {
    expect(() => calculateBorrowDays("2026-01-01", now)).toThrow(
      "Return date must be in the future",
    );
  });

  it("throws if the return date is in the past", () => {
    expect(() => calculateBorrowDays("2025-12-25", now)).toThrow(
      "Return date must be in the future",
    );
  });
});

describe("calculateOrderAmount", () => {
  it("charges only the cost for a purchase", () => {
    const amount = calculateOrderAmount({
      transactionType: TRANSACTION_TYPE.PURCHASE,
      cost: 500,
      rentPrice: 50,
      borrowDays: 1, // irrelevant for purchases
    });
    expect(amount).toBe(500);
  });

  it("charges rent-per-day plus a security deposit for a borrow", () => {
    const amount = calculateOrderAmount({
      transactionType: TRANSACTION_TYPE.BORROW,
      cost: 500,
      rentPrice: 50,
      borrowDays: 3,
    });
    // 3 days * ₹50/day + 50% of ₹500 deposit
    expect(amount).toBe(3 * 50 + SECURITY_PERCENT * 500);
  });
});

describe("calculateReturnRefund", () => {
  it("refunds the full deposit when returned on time", () => {
    const returnedAt = new Date("2026-01-05");
    const result = calculateReturnRefund({
      cost: 500,
      rentPrice: 50,
      expectedReturnDate: new Date("2026-01-10"),
      returnedAt,
    });
    expect(result.extraDays).toBe(0);
    expect(result.penalty).toBe(0);
    expect(result.finalRefundAmount).toBe(SECURITY_PERCENT * 500);
  });

  it("deducts a penalty per day late", () => {
    const result = calculateReturnRefund({
      cost: 500,
      rentPrice: 50,
      expectedReturnDate: new Date("2026-01-01"),
      returnedAt: new Date("2026-01-04"), // 3 days late
    });
    expect(result.extraDays).toBe(3);
    // Floating-point arithmetic isn't exact (3 * 1.1 * 50 can come out as
    // 165.00000000000003 depending on operation order) — toBeCloseTo
    // compares within a small tolerance instead of bit-for-bit equality.
    // Never use toBe() on a value that came from float math.
    expect(result.penalty).toBeCloseTo(3 * PENALTY_PERCENT * 50);
    expect(result.finalRefundAmount).toBeCloseTo(
      SECURITY_PERCENT * 500 - 3 * PENALTY_PERCENT * 50,
    );
  });

  it("can go negative when the penalty exceeds the deposit", () => {
    const result = calculateReturnRefund({
      cost: 100, // small deposit
      rentPrice: 50,
      expectedReturnDate: new Date("2026-01-01"),
      returnedAt: new Date("2026-01-20"), // 19 days late
    });
    expect(result.finalRefundAmount).toBeLessThan(0);
  });

  it("treats a missing expectedReturnDate as never late", () => {
    const result = calculateReturnRefund({
      cost: 500,
      rentPrice: 50,
      expectedReturnDate: null,
      returnedAt: new Date("2026-06-01"),
    });
    expect(result.extraDays).toBe(0);
  });
});
