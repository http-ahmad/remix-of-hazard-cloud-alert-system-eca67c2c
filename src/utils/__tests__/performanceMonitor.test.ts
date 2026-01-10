/**
 * Unit Tests for Performance Monitor
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { performanceMonitor } from '../performanceMonitor';

describe('Performance Monitor Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setEnabled(true);
  });

  describe('measure()', () => {
    test('measures synchronous function execution', () => {
      const result = performanceMonitor.measure('test-sync', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(result).toBe(499500);
      
      const metrics = performanceMonitor.getMetrics('test-sync');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThan(0);
      expect(metrics[0].success).toBe(true);
    });

    test('records failure when function throws', () => {
      expect(() => {
        performanceMonitor.measure('test-error', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const metrics = performanceMonitor.getMetrics('test-error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(false);
    });

    test('stores metadata with metrics', () => {
      performanceMonitor.measure(
        'test-metadata',
        () => 42,
        { input: 'test', iterations: 100 }
      );

      const metrics = performanceMonitor.getMetrics('test-metadata');
      expect(metrics[0].metadata).toEqual({ input: 'test', iterations: 100 });
    });
  });

  describe('measureAsync()', () => {
    test('measures async function execution', async () => {
      const result = await performanceMonitor.measureAsync('test-async', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      
      const metrics = performanceMonitor.getMetrics('test-async');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    test('records failure for rejected promises', async () => {
      await expect(
        performanceMonitor.measureAsync('test-async-error', async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');

      const metrics = performanceMonitor.getMetrics('test-async-error');
      expect(metrics[0].success).toBe(false);
    });
  });

  describe('getStats()', () => {
    test('calculates correct statistics', () => {
      // Run same operation multiple times
      for (let i = 0; i < 5; i++) {
        performanceMonitor.measure('test-stats', () => {
          let sum = 0;
          for (let j = 0; j < 100; j++) sum += j;
          return sum;
        });
      }

      const stats = performanceMonitor.getStats('test-stats');
      
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(5);
      expect(stats!.avgTime).toBeGreaterThan(0);
      expect(stats!.minTime).toBeLessThanOrEqual(stats!.avgTime);
      expect(stats!.maxTime).toBeGreaterThanOrEqual(stats!.avgTime);
      expect(stats!.successRate).toBe(1);
    });

    test('returns null for unknown operation', () => {
      const stats = performanceMonitor.getStats('unknown-operation');
      expect(stats).toBeNull();
    });
  });

  describe('getSummary()', () => {
    test('provides overall performance summary', () => {
      performanceMonitor.measure('op1', () => 1);
      performanceMonitor.measure('op2', () => 2);
      performanceMonitor.measure('op3', () => 3);

      const summary = performanceMonitor.getSummary();

      expect(summary.totalOperations).toBe(3);
      expect(summary.totalTime).toBeGreaterThan(0);
      expect(summary.successRate).toBe(1);
      expect(summary.slowestOperations).toHaveLength(3);
    });
  });

  describe('setEnabled()', () => {
    test('disabling skips measurement', () => {
      performanceMonitor.setEnabled(false);
      
      performanceMonitor.measure('disabled-test', () => 42);
      
      const metrics = performanceMonitor.getMetrics('disabled-test');
      expect(metrics).toHaveLength(0);
    });
  });

  describe('export()', () => {
    test('exports metrics as valid JSON', () => {
      performanceMonitor.measure('export-test', () => 1);
      
      const exported = performanceMonitor.export();
      const parsed = JSON.parse(exported);

      expect(parsed.metrics).toHaveLength(1);
      expect(parsed.summary).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });
  });
});
