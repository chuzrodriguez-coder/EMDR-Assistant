import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { startCleanupScheduler } from "./lib/cleanup";

const app: Express = express();

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

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

function parseAllowedOrigins(): string[] | true {
  if (process.env.NODE_ENV !== "production") return true;

  const raw: string[] = [];

  if (process.env.ALLOWED_ORIGIN) {
    raw.push(...process.env.ALLOWED_ORIGIN.split(","));
  }
  if (process.env.REPLIT_DOMAINS) {
    raw.push(...process.env.REPLIT_DOMAINS.split(","));
  }

  const normalized = raw
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => {
      if (s.startsWith("http://") || s.startsWith("https://")) return [s];
      return [`https://${s}`, `http://${s}`];
    });

  return normalized.length > 0 ? normalized : true;
}

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ["Retry-After"],
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.use(clerkMiddleware());

app.use("/api", router);

startCleanupScheduler();

export default app;
