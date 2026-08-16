import { env } from "../config/environment";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[env.LOG_LEVEL];
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      console.debug(`[${formatTimestamp()}] [DEBUG] [${this.context}] ${message}`, data ? JSON.stringify(data) : "");
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      console.log(`[${formatTimestamp()}] [INFO]  [${this.context}] ${message}`, data ? JSON.stringify(data) : "");
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      console.warn(`[${formatTimestamp()}] [WARN]  [${this.context}] ⚠️ ${message}`, data ? JSON.stringify(data) : "");
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog("error")) {
      const errStr = error instanceof Error ? `${error.message}\n${error.stack}` : error ? JSON.stringify(error) : "";
      console.error(`[${formatTimestamp()}] [ERROR] [${this.context}] ❌ ${message} ${errStr}`);
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
