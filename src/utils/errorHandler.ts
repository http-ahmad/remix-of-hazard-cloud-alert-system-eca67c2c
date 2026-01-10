/**
 * Centralized error handling utilities
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

/**
 * Create a standardized application error
 */
export function createAppError(
  message: string,
  options?: {
    code?: string;
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    originalError?: Error;
  }
): AppError {
  return {
    message,
    code: options?.code,
    severity: options?.severity || 'medium',
    context: options?.context,
    timestamp: new Date(),
    stack: options?.originalError?.stack,
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe number parsing with validation
 */
export function safeParseNumber(
  value: unknown,
  options?: {
    fallback?: number;
    min?: number;
    max?: number;
  }
): number {
  const fallback = options?.fallback ?? 0;
  
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }

  if (options?.min !== undefined && num < options.min) {
    return options.min;
  }

  if (options?.max !== undefined && num > options.max) {
    return options.max;
  }

  return num;
}

/**
 * Safe async operation wrapper with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options?: {
    fallback?: T;
    onError?: (error: Error) => void;
    timeout?: number;
  }
): Promise<T | undefined> {
  try {
    if (options?.timeout) {
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), options.timeout)
        ),
      ]);
    }
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options?.onError?.(err);
    console.error('Async operation failed:', err);
    return options?.fallback;
  }
}

/**
 * Validate required parameters
 */
export function validateParams<T extends Record<string, unknown>>(
  params: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = requiredFields.filter(
    (field) => params[field] === undefined || params[field] === null
  );
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Check if a value is a valid coordinate
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 30000;
  const factor = options?.factor ?? 2;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError!;
}

export default {
  createAppError,
  safeJsonParse,
  safeParseNumber,
  safeAsync,
  validateParams,
  clamp,
  roundTo,
  isValidCoordinate,
  retryWithBackoff,
};
