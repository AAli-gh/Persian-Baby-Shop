import type { Request, Response, NextFunction, RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Length of the window in milliseconds. */
  windowMs: number;
  /** Requests allowed per key per window. */
  max: number;
  /** Message returned once the budget is spent. */
  message?: string;
  /** Defaults to the client IP; override to rate limit per account, per email, … */
  keyGenerator?: (req: Request) => string;
}

const CLEANUP_INTERVAL_MS = 60_000;

/**
 * Fixed-window rate limiter kept in process memory. It is deliberately
 * dependency-free and therefore per-instance: with several API instances the
 * effective budget is `max` per instance. That is enough to blunt scripted
 * abuse of the public endpoints; a shared store (Redis) is the next step if the
 * deployment is scaled out.
 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, message = "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد تلاش کنید." } = options;
  const keyGenerator = options.keyGenerator ?? ((req: Request) => req.ip ?? "unknown");
  const buckets = new Map<string, Bucket>();
  let lastCleanup = Date.now();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();

    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
      lastCleanup = now;
    }

    const key = keyGenerator(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", max - 1);
      next();
      return;
    }

    bucket.count += 1;
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

/** Generous ceiling for the whole API, to cap accidental hammering. */
export const globalLimiter: RequestHandler = rateLimit({ windowMs: 60_000, max: 300 });

/** For unauthenticated write endpoints (reviews, newsletter, stock alerts). */
export const publicWriteLimiter: RequestHandler = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "تعداد درخواست‌ها بیش از حد مجاز است. یک دقیقه بعد تلاش کنید.",
});

/** For endpoints that would otherwise act as a guessing oracle (discount codes). */
export const guessableLimiter: RequestHandler = rateLimit({
  windowMs: 60_000,
  max: 15,
  message: "تلاش‌های ناموفق زیاد است. یک دقیقه بعد تلاش کنید.",
});

/** For order placement, which mutates stock. */
export const checkoutLimiter: RequestHandler = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: "تعداد درخواست‌های ثبت سفارش بیش از حد مجاز است.",
});
