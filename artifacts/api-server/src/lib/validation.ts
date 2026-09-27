import { z } from "zod";
import {
  AddToCartBody,
  UpdateCartItemBody,
  RemoveCartItemBody,
  CreateOrderBody,
  CreateReviewBody,
} from "@workspace/api-zod";

/**
 * Server-side validation.
 *
 * The generated schemas mirror the OpenAPI contract, but OpenAPI's `integer`
 * becomes a plain `zod.number()`, which accepts fractions. Money and stock are
 * computed from these values, so every quantity and identifier is re-checked
 * here as a whole number. Anything a route reads off `req.body` gets a schema
 * in this file rather than a cast.
 */

export const MAX_CART_QUANTITY = 99;

const positiveInt = z.number().int().positive();
const sessionId = z.string().min(8).max(128);
const quantity = z.number().int().min(1).max(MAX_CART_QUANTITY);

export const AddToCartInput = AddToCartBody.extend({
  productId: positiveInt,
  quantity,
  sessionId,
});

export const UpdateCartItemInput = UpdateCartItemBody.extend({ quantity, sessionId });

export const RemoveCartItemInput = RemoveCartItemBody.extend({ sessionId });

export const CartSessionQuery = z.object({ sessionId });

export const CreateOrderInput = CreateOrderBody.extend({
  sessionId,
  shippingMethod: z.enum(["standard", "express", "pickup"]),
});

export const CreateReviewInput = CreateReviewBody.extend({
  productId: positiveInt,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const NewsletterSubscribeInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(120).optional(),
  source: z.string().trim().min(1).max(40).optional(),
});

export const UpdateStockInput = z.object({
  stock: z.number().int().min(0).max(1_000_000),
  note: z.string().trim().max(500).optional(),
});

export const BulkRestockInput = z.object({
  items: z
    .array(z.object({ id: positiveInt, stock: z.number().int().min(0).max(1_000_000) }))
    .min(1)
    .max(500),
});

export const SmsTemplateInput = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["otp", "order", "shipping", "campaign", "cart"]),
  text: z.string().trim().min(1).max(1000),
  isActive: z.boolean().optional(),
});

export const SmsTemplateUpdateInput = SmsTemplateInput.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "هیچ فیلدی برای ویرایش ارسال نشده است" },
);

export const SmsSendInput = z.object({
  phones: z.array(z.string().trim().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است")).min(1).max(500),
  templateId: positiveInt,
  variables: z.record(z.string().max(200)).optional(),
});

export const StockNotifySubscribeInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});
