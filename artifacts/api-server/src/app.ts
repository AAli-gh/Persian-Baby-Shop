import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middleware/securityHeaders";
import { globalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

const isDevelopment = process.env.NODE_ENV !== "production";

// Behind the deployment router, the client address only survives in
// X-Forwarded-For; without this every request would rate limit as one IP.
app.set("trust proxy", Number(process.env["TRUST_PROXY_HOPS"] ?? 1));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(securityHeaders);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

/**
 * The SPA is served from the same origin as the API, so no cross-origin call is
 * needed by default. Extra origins must be named explicitly in
 * `CORS_ALLOWED_ORIGINS`: reflecting an arbitrary `Origin` back while allowing
 * credentials would let any site call this API with the visitor's session.
 */
const allowedOrigins = (process.env["CORS_ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    // No Origin header: same-origin navigation, curl, server-to-server.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isDevelopment && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use(
  "/api/uploads",
  express.static(uploadsDir, {
    // Uploaded files are user content: never let the browser execute them.
    setHeaders(res) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.use("/api", globalLimiter, router);

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
