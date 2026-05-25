/**
 * Safe execution wrapper – adds timeouts, error normalization, and audit logging
 */

export interface ExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration_ms: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function safeExecute<T>(
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ExecutionResult<T>> {
  const start = Date.now();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Execution timed out after ${timeoutMs}ms`)),
      timeoutMs,
    ),
  );

  try {
    const data = await Promise.race([fn(), timeout]);
    return {
      success: true,
      data,
      duration_ms: Date.now() - start,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error,
      duration_ms: Date.now() - start,
    };
  }
}

export function truncateString(str: string, maxLength = 2000): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + `\n...[truncated ${str.length - maxLength} chars]`;
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  blacklist: string[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!blacklist.some((b) => key.toLowerCase().includes(b.toLowerCase()))) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}
