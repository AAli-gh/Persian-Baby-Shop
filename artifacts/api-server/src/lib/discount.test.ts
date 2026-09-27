import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDiscount } from "./discount";
import { discountsTable } from "@workspace/db";

type DiscountRow = typeof discountsTable.$inferSelect;

function discount(overrides: Partial<DiscountRow> = {}): DiscountRow {
  return {
    id: 1,
    code: "OFF10",
    type: "percent",
    value: "10",
    minOrder: null,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

test("a missing code is rejected", () => {
  const result = evaluateDiscount(undefined, 100_000);
  assert.equal(result.valid, false);
});

test("percentage discounts are rounded to whole Toman", () => {
  const result = evaluateDiscount(discount({ value: "15" }), 99_999);
  assert.equal(result.valid, true);
  assert.equal(result.valid && result.amount, 15_000);
});

test("a fixed discount never exceeds the subtotal", () => {
  const result = evaluateDiscount(discount({ type: "fixed", value: "500000" }), 120_000);
  assert.equal(result.valid && result.amount, 120_000);
});

test("an inactive or expired code is rejected", () => {
  assert.equal(evaluateDiscount(discount({ isActive: false }), 100_000).valid, false);
  const expired = discount({ expiresAt: new Date("2026-01-02T00:00:00Z") });
  assert.equal(evaluateDiscount(expired, 100_000, new Date("2026-02-01T00:00:00Z")).valid, false);
});

test("the minimum order amount is enforced", () => {
  const result = evaluateDiscount(discount({ minOrder: "200000" }), 199_999);
  assert.equal(result.valid, false);
  assert.equal(result.valid === false && result.reason, "min_order");
});

test("a code at its usage cap is rejected", () => {
  const result = evaluateDiscount(discount({ maxUses: 5, usedCount: 5 }), 100_000);
  assert.equal(result.valid === false && result.reason, "exhausted");
});

test("a code below its usage cap still applies", () => {
  assert.equal(evaluateDiscount(discount({ maxUses: 5, usedCount: 4 }), 100_000).valid, true);
});
