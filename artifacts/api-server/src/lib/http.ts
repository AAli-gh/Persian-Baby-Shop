import type { Request, Response } from "express";

/**
 * Parses a positive integer route parameter. Returns null for anything that is
 * not a plain positive integer, so callers never hand `NaN` to a query.
 */
export function parseId(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Parses a positive integer route parameter, answering 400 when it is invalid.
 * Returns null once the response has been sent.
 */
export function requireId(req: Request, res: Response, param = "id"): number | null {
  const id = parseId(req.params[param]);
  if (id === null) {
    res.status(400).json({ error: "شناسه نامعتبر است" });
    return null;
  }
  return id;
}

/** Clamps a page/limit pair coming from user input. */
export function parsePaging(
  rawPage: unknown,
  rawLimit: unknown,
  { defaultLimit = 20, maxLimit = 100 } = {},
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);
  const parsedLimit = Number.parseInt(String(rawLimit ?? defaultLimit), 10);
  const limit = Math.min(maxLimit, Math.max(1, Number.isNaN(parsedLimit) ? defaultLimit : parsedLimit));
  return { page, limit, offset: (page - 1) * limit };
}
