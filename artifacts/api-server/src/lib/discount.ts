import { discountsTable } from "@workspace/db";

type DiscountRow = typeof discountsTable.$inferSelect;

export type DiscountRejection =
  | "not_found"
  | "inactive"
  | "expired"
  | "min_order"
  | "exhausted";

export const DISCOUNT_MESSAGES: Record<DiscountRejection, string> = {
  not_found: "کد تخفیف نامعتبر است",
  inactive: "کد تخفیف نامعتبر است",
  expired: "کد تخفیف منقضی شده است",
  min_order: "حداقل مبلغ سبد خرید رعایت نشده است",
  exhausted: "ظرفیت کد تخفیف پر شده است",
};

export type DiscountEvaluation =
  | { valid: true; discount: DiscountRow; amount: number }
  | { valid: false; reason: DiscountRejection; message: string };

/**
 * The single place that decides whether a discount applies and how much it is
 * worth. Both `POST /discounts/validate` and order creation go through it, so
 * the quote the customer is shown is the one the order is charged with.
 *
 * The amount is always clamped to the cart subtotal: a discount can take an
 * order down to zero but never below it.
 */
export function evaluateDiscount(
  discount: DiscountRow | undefined,
  subtotal: number,
  now = new Date(),
): DiscountEvaluation {
  const reject = (reason: DiscountRejection): DiscountEvaluation => ({
    valid: false,
    reason,
    message: DISCOUNT_MESSAGES[reason],
  });

  if (!discount) return reject("not_found");
  if (!discount.isActive) return reject("inactive");
  if (discount.expiresAt && discount.expiresAt < now) return reject("expired");
  if (discount.minOrder && subtotal < Number(discount.minOrder)) {
    return {
      valid: false,
      reason: "min_order",
      message: `حداقل خرید ${Number(discount.minOrder).toLocaleString("fa-IR")} تومان الزامی است`,
    };
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return reject("exhausted");
  }

  const raw =
    discount.type === "percent"
      ? (subtotal * Number(discount.value)) / 100
      : Number(discount.value);
  const amount = Math.max(0, Math.min(subtotal, Math.round(raw)));

  return { valid: true, discount, amount };
}

export function serializeDiscount(discount: DiscountRow) {
  return {
    ...discount,
    value: Number(discount.value),
    minOrder: discount.minOrder ? Number(discount.minOrder) : null,
    expiresAt: discount.expiresAt ? discount.expiresAt.toISOString() : null,
  };
}
