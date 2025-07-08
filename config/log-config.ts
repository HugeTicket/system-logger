import path from "path";

export const LOG_DIR = path.resolve(__dirname, "..", "..", "logs");

export const LOG_FILE_PATH = path.join(LOG_DIR, "system-errors.log");

export const LOG_LEVEL = "error";
