import type { Request, Response, NextFunction } from "express";

/** Terminal 404 for unmatched API routes, so the client always gets JSON. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "مسیر مورد نظر یافت نشد" });
}

/**
 * Single JSON error handler. Express 5 forwards rejected promises from async
 * handlers here, so an unexpected failure anywhere becomes a logged 500 with a
 * stable body instead of the default HTML error page.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status =
    typeof err === "object" && err !== null && "status" in err && typeof err.status === "number"
      ? err.status
      : 500;

  req.log?.error({ err }, "request failed");

  if (status >= 400 && status < 500) {
    const message =
      typeof err === "object" && err !== null && "message" in err && typeof err.message === "string"
        ? err.message
        : "درخواست نامعتبر است";
    res.status(status).json({ error: message });
    return;
  }

  res.status(500).json({ error: "خطای داخلی سرور" });
}
