import type { Request, Response, NextFunction } from "express";

/**
 * Baseline response hardening for a JSON API. Kept dependency-free: the API
 * serves JSON plus the uploads directory, so the useful headers are the ones
 * that stop a response from being sniffed, framed or embedded.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; sandbox");
  res.removeHeader("X-Powered-By");
  next();
}
