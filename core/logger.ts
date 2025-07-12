import winston from "winston";
import fs from "fs";
import { LOG_FILE_PATH, LOG_DIR, LOG_LEVEL } from "../config/log-config";

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
	fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logger = winston.createLogger({
	level: LOG_LEVEL,
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.errors({ stack: true }),
		winston.format.printf(({ timestamp, level, message, stack }) => {
			return `[${timestamp}] ${level.toUpperCase()}:\n${stack || message}\n`;
		})
	),
	transports: [
		new winston.transports.File({ filename: LOG_FILE_PATH }),
	],
});

export default logger;
