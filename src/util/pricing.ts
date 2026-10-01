import { PENALTY_PERCENT, SECURITY_PERCENT } from "./constant";
import { TRANSACTION_TYPE } from "../enums";

/**
 * Pure pricing/penalty logic, deliberately kept free of any DB or GraphQL
 * imports so it can be unit tested without a database or a mocked
 * TypeORM query runner. Every function takes the values it needs as plain
 * arguments (including "now", instead of calling `new Date()` internally)
 * so tests can pass a fixed clock and get a deterministic result.
 */

/** Whole days between two dates, ignoring time-of-day (rounds up). */
export const daysBetween = (from: Date, to: Date): number => {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * How many days a borrow covers, given the requested return date.
 * Defaults to 1 day if none was given. Throws if the resulting span isn't
 * in the future.
 */
export const calculateBorrowDays = (
  expectedReturnDate: string | Date | undefined,
  now: Date = new Date(),
): number => {
  if (!expectedReturnDate) return 1;

  const days = daysBetween(now, new Date(expectedReturnDate));
  if (days <= 0) {
    throw new Error("Return date must be in the future");
  }
  return days;
};

/**
 * Total charge for a new order. Purchases are just the book's cost;
 * borrows are rent-per-day × days, plus a refundable security deposit
 * (a percentage of the purchase price).
 */
export const calculateOrderAmount = (params: {
  transactionType: TRANSACTION_TYPE;
  cost: number;
  rentPrice: number;
  borrowDays: number;
}): number => {
  const { transactionType, cost, rentPrice, borrowDays } = params;

  if (transactionType === TRANSACTION_TYPE.PURCHASE) {
    return cost;
  }

  return borrowDays * rentPrice + SECURITY_PERCENT * cost;
};

export interface ReturnRefund {
  /** The full security deposit, before any penalty is deducted. */
  refundAmount: number;
  /** Whole days late (0 if returned on time or early). */
  extraDays: number;
  /** Amount deducted from the deposit for lateness. */
  penalty: number;
  /** What actually gets refunded — can go negative if the penalty exceeds the deposit. */
  finalRefundAmount: number;
}

/**
 * Refund due when a borrowed book is returned: the security deposit minus
 * a late penalty (rent-per-day × a penalty multiplier × days late).
 */
export const calculateReturnRefund = (params: {
  cost: number;
  rentPrice: number;
  expectedReturnDate: Date | null | undefined;
  returnedAt?: Date;
}): ReturnRefund => {
  const { cost, rentPrice, expectedReturnDate, returnedAt = new Date() } =
    params;

  const refundAmount = SECURITY_PERCENT * cost;

  let extraDays = 0;
  if (expectedReturnDate && returnedAt.getTime() > expectedReturnDate.getTime()) {
    extraDays = daysBetween(expectedReturnDate, returnedAt);
  }

  const penalty = extraDays * (PENALTY_PERCENT * rentPrice);
  const finalRefundAmount = refundAmount - penalty;

  return { refundAmount, extraDays, penalty, finalRefundAmount };
};
