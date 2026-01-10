/**
 * Performance Monitoring Utilities
 * Tracks calculation times, memory usage, and provides performance insights
 */

export interface PerformanceMetric {
  name: string;
  duration: number; // milliseconds
  timestamp: number;
  memoryUsed?: number; // bytes
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  lastRun: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private enabled = true;

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    if (!this.enabled) return fn();

    const start = performance.now();
    const memoryBefore = this.getMemoryUsage();
    let success = true;

    try {
      return fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        memoryUsed: memoryAfter - memoryBefore,
        success,
        metadata,
      });
    }
  }

  /**
   * Measure execution time of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) return fn();

    const start = performance.now();
    const memoryBefore = this.getMemoryUsage();
    let success = true;

    try {
      return await fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        memoryUsed: memoryAfter - memoryBefore,
        success,
        metadata,
      });
    }
  }

  /**
   * Start a manual timing session
   */
  startTiming(name: string): () => void {
    const start = performance.now();
    const memoryBefore = this.getMemoryUsage();

    return (success = true, metadata?: Record<string, unknown>) => {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        memoryUsed: memoryAfter - memoryBefore,
        success,
        metadata,
      });
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Trim old metrics if exceeding limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 100) {
      console.warn(`[Performance] Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get all metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration);
    const successCount = metrics.filter((m) => m.success).length;

    return {
      name,
      count: metrics.length,
      totalTime: durations.reduce((a, b) => a + b, 0),
      avgTime: durations.reduce((a, b) => a + b, 0) / metrics.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      successRate: successCount / metrics.length,
      lastRun: metrics[metrics.length - 1].timestamp,
    };
  }

  /**
   * Get statistics for all tracked operations
   */
  getAllStats(): PerformanceStats[] {
    const names = [...new Set(this.metrics.map((m) => m.name))];
    return names.map((name) => this.getStats(name)!).filter(Boolean);
  }

  /**
   * Get a performance summary
   */
  getSummary(): {
    totalOperations: number;
    totalTime: number;
    avgTime: number;
    successRate: number;
    slowestOperations: PerformanceStats[];
  } {
    const allStats = this.getAllStats();
    const totalOps = this.metrics.length;
    const totalTime = this.metrics.reduce((a, m) => a + m.duration, 0);
    const successCount = this.metrics.filter((m) => m.success).length;

    return {
      totalOperations: totalOps,
      totalTime,
      avgTime: totalOps > 0 ? totalTime / totalOps : 0,
      successRate: totalOps > 0 ? successCount / totalOps : 1,
      slowestOperations: allStats.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Global singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (this: any, ...args: any[]) {
      return performanceMonitor.measure(metricName, () => originalMethod.apply(this, args));
    } as T;

    return descriptor;
  };
}

export default performanceMonitor;
