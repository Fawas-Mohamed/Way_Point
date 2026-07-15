import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { swaggerSpec } from "./config/swagger";
import { v1Router } from "./routes/index";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true, // required so the httpOnly refresh cookie is sent/received cross-origin in dev
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
  app.use("/api", apiRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

  app.use("/api/v1", v1Router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
