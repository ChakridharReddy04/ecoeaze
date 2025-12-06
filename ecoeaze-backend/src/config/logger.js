import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "..", "logs");

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
};

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    // JSON format is great for Logstash ingestion
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Stream for morgan HTTP logger (optional)
 * Use: app.use(morgan("combined", { stream: httpLoggerStream }));
 */
export const httpLoggerStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
