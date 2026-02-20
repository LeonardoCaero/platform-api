import fs from "fs";
import path from "path";
import winston, { format } from "winston";

const logDir = path.join(process.cwd(), "logs");
fs.mkdirSync(logDir, { recursive: true });

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}${extra}`;
  })
);

const consoleFormat = format.combine(
  format((info) => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  format.colorize({ level: true }),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${extra}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(
        logDir,
        `error-${new Date().toISOString().slice(0, 10)}.log`
      ),
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: path.join(
        logDir,
        `app-${new Date().toISOString().slice(0, 10)}.log`
      ),
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: fileFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
      format: fileFormat,
    }),
  ],
});
