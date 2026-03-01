import http from "http";
import app from "./app";
import { prisma } from "./db/prisma";
import { logger } from "./common/logger/logger";
import { env } from "./config/env";

const PORT = env.PORT;

async function bootstrap() {
  let server: http.Server;

  try {
    logger.info("Starting server...");

    await prisma.$connect();
    logger.info("Database connected");

    server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`API running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Shutting down...`);

      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info("Database disconnected");
          process.exit(0);
        } catch (err) {
          logger.error("Error during shutdown", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    logger.error("Failed to bootstrap application", err);
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(1);
  }
}

bootstrap();
