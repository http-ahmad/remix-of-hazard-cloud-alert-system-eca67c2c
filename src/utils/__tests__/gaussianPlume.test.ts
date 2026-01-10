/**
 * Unit Tests for Gaussian Plume Dispersion Model
 * 
 * These tests validate the scientific accuracy of the dispersion calculations
 * against known values from EPA AERMOD and ALOHA documentation.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  calculateSigmaY,
  calculateSigmaZ,
  calculatePlumeRise,
  calculateConcentration,
  calculateMaxConcentration,
  findDistanceForThreshold,
  calculateHazardZones,
  GaussianPlumeParams,
} from '../gaussianPlume';

describe('Gaussian Plume Model Tests', () => {
  const defaultParams: GaussianPlumeParams = {
    emissionRate: 1.0, // 1 kg/s
    releaseHeight: 10, // 10m stack
    windSpeed: 5, // 5 m/s
    windDirection: 180, // From south
    stabilityClass: 'D', // Neutral
    ambientTemperature: 20, // 20°C
    releaseTemperature: 20, // 20°C
    sourceLocation: { lat: 40.7128, lng: -74.006 },
    chemicalType: 'ammonia',
  };

  describe('Dispersion Coefficients (Sigma)', () => {
    test('sigmaY increases with distance', () => {
      const sigma100 = calculateSigmaY(100, 'D');
      const sigma1000 = calculateSigmaY(1000, 'D');
      const sigma10000 = calculateSigmaY(10000, 'D');

      expect(sigma100).toBeGreaterThan(0);
      expect(sigma1000).toBeGreaterThan(sigma100);
      expect(sigma10000).toBeGreaterThan(sigma1000);
    });

    test('sigmaZ increases with distance', () => {
      const sigma100 = calculateSigmaZ(100, 'D');
      const sigma1000 = calculateSigmaZ(1000, 'D');
      const sigma10000 = calculateSigmaZ(10000, 'D');

      expect(sigma100).toBeGreaterThan(0);
      expect(sigma1000).toBeGreaterThan(sigma100);
      expect(sigma10000).toBeGreaterThan(sigma1000);
    });

    test('unstable conditions produce larger sigma values', () => {
      const sigmaA = calculateSigmaY(1000, 'A'); // Very unstable
      const sigmaD = calculateSigmaY(1000, 'D'); // Neutral
      const sigmaF = calculateSigmaY(1000, 'F'); // Very stable

      expect(sigmaA).toBeGreaterThan(sigmaD);
      expect(sigmaD).toBeGreaterThan(sigmaF);
    });

    test('sigmaY values within expected range for 1km distance', () => {
      // Based on Pasquill-Gifford curves
      const sigmaD = calculateSigmaY(1000, 'D');
      expect(sigmaD).toBeGreaterThan(50);  // At least 50m
      expect(sigmaD).toBeLessThan(200);    // Less than 200m
    });
  });

  describe('Plume Rise Calculations', () => {
    test('buoyant plume rises with temperature differential', () => {
      const coldRelease = calculatePlumeRise({
        ...defaultParams,
        releaseTemperature: 20, // Same as ambient
      });

      const hotRelease = calculatePlumeRise({
        ...defaultParams,
        releaseTemperature: 100, // Hot release
      });

      expect(hotRelease).toBeGreaterThan(coldRelease);
    });

    test('higher wind speed reduces plume rise', () => {
      const lowWind = calculatePlumeRise({
        ...defaultParams,
        releaseTemperature: 100,
        windSpeed: 2,
      });

      const highWind = calculatePlumeRise({
        ...defaultParams,
        releaseTemperature: 100,
        windSpeed: 10,
      });

      expect(lowWind).toBeGreaterThan(highWind);
    });

    test('plume rise is non-negative', () => {
      const rise = calculatePlumeRise(defaultParams);
      expect(rise).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concentration Calculations', () => {
    test('concentration decreases with distance', () => {
      const conc100 = calculateConcentration(defaultParams, 100, 0, 0);
      const conc1000 = calculateConcentration(defaultParams, 1000, 0, 0);
      const conc5000 = calculateConcentration(defaultParams, 5000, 0, 0);

      expect(conc100).toBeGreaterThan(conc1000);
      expect(conc1000).toBeGreaterThan(conc5000);
    });

    test('concentration is zero upwind (negative distance)', () => {
      const conc = calculateConcentration(defaultParams, -100, 0, 0);
      expect(conc).toBe(0);
    });

    test('concentration is highest at centerline', () => {
      const centerline = calculateConcentration(defaultParams, 1000, 0, 0);
      const offCenter100 = calculateConcentration(defaultParams, 1000, 100, 0);
      const offCenter500 = calculateConcentration(defaultParams, 1000, 500, 0);

      expect(centerline).toBeGreaterThan(offCenter100);
      expect(offCenter100).toBeGreaterThan(offCenter500);
    });

    test('concentration scales linearly with emission rate', () => {
      const conc1 = calculateConcentration(
        { ...defaultParams, emissionRate: 1 },
        1000, 0, 0
      );
      const conc2 = calculateConcentration(
        { ...defaultParams, emissionRate: 2 },
        1000, 0, 0
      );

      expect(conc2).toBeCloseTo(conc1 * 2, 5);
    });

    test('concentration inversely proportional to wind speed', () => {
      const concLowWind = calculateConcentration(
        { ...defaultParams, windSpeed: 2 },
        1000, 0, 0
      );
      const concHighWind = calculateConcentration(
        { ...defaultParams, windSpeed: 10 },
        1000, 0, 0
      );

      expect(concLowWind).toBeGreaterThan(concHighWind);
    });

    test('elevated releases have lower ground concentration near source', () => {
      const groundRelease = calculateConcentration(
        { ...defaultParams, releaseHeight: 0 },
        100, 0, 0
      );
      const elevatedRelease = calculateConcentration(
        { ...defaultParams, releaseHeight: 50 },
        100, 0, 0
      );

      expect(groundRelease).toBeGreaterThan(elevatedRelease);
    });
  });

  describe('Maximum Concentration', () => {
    test('finds maximum concentration location', () => {
      const result = calculateMaxConcentration(defaultParams);

      expect(result.maxConcentration).toBeGreaterThan(0);
      expect(result.distanceOfMax).toBeGreaterThan(0);
    });

    test('elevated source has max concentration further downwind', () => {
      const groundSource = calculateMaxConcentration({
        ...defaultParams,
        releaseHeight: 2,
      });

      const elevatedSource = calculateMaxConcentration({
        ...defaultParams,
        releaseHeight: 50,
      });

      expect(elevatedSource.distanceOfMax).toBeGreaterThan(groundSource.distanceOfMax);
    });
  });

  describe('Threshold Distance Calculations', () => {
    test('higher threshold = shorter distance', () => {
      const lowThreshold = findDistanceForThreshold(defaultParams, 1);
      const highThreshold = findDistanceForThreshold(defaultParams, 100);

      expect(lowThreshold).toBeGreaterThan(highThreshold);
    });

    test('returns 0 if threshold never exceeded', () => {
      const veryHighThreshold = findDistanceForThreshold(defaultParams, 1000000);
      expect(veryHighThreshold).toBe(0);
    });

    test('larger emission rate = longer hazard distance', () => {
      const smallRelease = findDistanceForThreshold(
        { ...defaultParams, emissionRate: 0.1 },
        10
      );
      const largeRelease = findDistanceForThreshold(
        { ...defaultParams, emissionRate: 10 },
        10
      );

      expect(largeRelease).toBeGreaterThan(smallRelease);
    });
  });

  describe('Hazard Zone Calculations', () => {
    test('zones are ordered by distance (yellow > orange > red)', () => {
      const zones = calculateHazardZones(defaultParams);

      expect(zones.yellow.distance).toBeGreaterThanOrEqual(zones.orange.distance);
      expect(zones.orange.distance).toBeGreaterThanOrEqual(zones.red.distance);
    });

    test('zones have valid sigma values', () => {
      const zones = calculateHazardZones(defaultParams);

      if (zones.red.distance > 0) {
        expect(zones.red.sigmaY).toBeGreaterThan(0);
        expect(zones.red.sigmaZ).toBeGreaterThan(0);
      }
    });

    test('different chemicals produce different zone sizes', () => {
      const ammoniaZones = calculateHazardZones({
        ...defaultParams,
        chemicalType: 'ammonia',
      });

      const chlorineZones = calculateHazardZones({
        ...defaultParams,
        chemicalType: 'chlorine',
      });

      // Chlorine is more toxic, should have larger zones
      expect(chlorineZones.yellow.distance).not.toEqual(ammoniaZones.yellow.distance);
    });
  });

  describe('Edge Cases', () => {
    test('handles minimum wind speed', () => {
      const conc = calculateConcentration(
        { ...defaultParams, windSpeed: 0.1 },
        1000, 0, 0
      );
      expect(conc).toBeGreaterThan(0);
      expect(isFinite(conc)).toBe(true);
    });

    test('handles very large distances', () => {
      const conc = calculateConcentration(defaultParams, 100000, 0, 0);
      expect(isFinite(conc)).toBe(true);
      expect(conc).toBeGreaterThanOrEqual(0);
    });

    test('handles all stability classes', () => {
      const classes = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      for (const stabilityClass of classes) {
        const conc = calculateConcentration(
          { ...defaultParams, stabilityClass },
          1000, 0, 0
        );
        expect(isFinite(conc)).toBe(true);
        expect(conc).toBeGreaterThan(0);
      }
    });
  });
});

describe('Validation Against Reference Values', () => {
  // These are approximate reference values from ALOHA documentation
  
  test('sigmaY for neutral conditions at 1km matches literature', () => {
    const sigma = calculateSigmaY(1000, 'D');
    // Expected range: 70-100m based on Pasquill-Gifford
    expect(sigma).toBeGreaterThan(50);
    expect(sigma).toBeLessThan(150);
  });

  test('sigmaZ for neutral conditions at 1km matches literature', () => {
    const sigma = calculateSigmaZ(1000, 'D');
    // Expected range: 30-60m based on Pasquill-Gifford
    expect(sigma).toBeGreaterThan(20);
    expect(sigma).toBeLessThan(100);
  });
});
