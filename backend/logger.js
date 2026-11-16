import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "debug.log");

export const log = (...args) => {
  const message =
    `[${new Date().toISOString()}] ` +
    args.map(a => (typeof a === "object" ? JSON.stringify(a, null, 2) : a)).join(" ") +
    "\n";

  try {
    fs.appendFileSync(logFile, message);
  } catch (err) {
    // If disk write fails, don't crash the app over logging
    process.stderr.write(`[logger] Failed to write log file: ${err.message}\n`);
  }

  // Also print to console
  process.stdout.write(message);
};