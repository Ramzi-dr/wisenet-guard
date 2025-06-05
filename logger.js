import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Function to get current log file path
const getLogFilePath = () => {
  const now = new Date();
  const year = format(now, "yyyy");
  const month = format(now, "MMMM"); // Full month name
  const day = format(now, "dd"); // Day with leading zero
  const dayOfWeek = format(now, "EEEE"); // Day of the week

  // Base log directory (Year > Month)
  const baseLogPath = path.join("./logs", year, month);

  // Ensure directories exist
  fs.mkdirSync(baseLogPath, { recursive: true });

  // Log file name (e.g., Sunday_23.log)
  return path.join(baseLogPath, `${dayOfWeek}_${day}.log`);
};

// Variable to track the current log file path
let currentLogFilePath = getLogFilePath();

// Function to write logs
const writeLog = (level, message) => {
  const now = new Date();
  const timestamp = format(now, "yyyy-MM-dd HH:mm:ss");

  // Check if the date has changed and update log file path
  const newLogFilePath = getLogFilePath();
  if (newLogFilePath !== currentLogFilePath) {
    currentLogFilePath = newLogFilePath;
  }

  // Create log message
  const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;

  // Append log to file
  fs.appendFileSync(currentLogFilePath, logMessage, { encoding: "utf8" });
};

// Export log functions
export const logger = {
  info: (msg) => writeLog("info", msg),
  warn: (msg) => writeLog("warn", msg),
  error: (msg) => writeLog("error", msg),
};
