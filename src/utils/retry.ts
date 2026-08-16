import { createLogger } from "./logger";

const logger = createLogger("RetryUtil");

export interface RetryOptions {
  retries?: number;
  minTimeoutMs?: number;
  factor?: number;
  name?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, minTimeoutMs = 1000, factor = 2, name = "Operation" } = options;

  let attempt = 0;
  let delay = minTimeoutMs;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        logger.error(`${name} failed after ${retries} retries`, error);
        throw error;
      }
      logger.warn(`${name} failed (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= factor;
    }
  }

  throw new Error(`${name} reached unreachable retry state`);
}
