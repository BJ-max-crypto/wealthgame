import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, clampPan, clampZoom, fitCityView, fitWorld, frameRect, zoomAt } from './camera';

describe('camera', () => {
  it('keeps the cursor world point fixed while zooming', () => {
    const next = zoomAt({ x: 0, y: 0, zoom: 1 }, 200, 100, 2);
    expect(next.zoom).toBe(2);
    expect((200 - next.x) / next.zoom).toBeCloseTo(200);
    expect((100 - next.y) / next.zoom).toBeCloseTo(100);
  });

  it('clamps extreme zoom', () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 10, 10, 99).zoom).toBe(MAX_ZOOM);
  });

  it('frames a district around its center', () => {
    const rect = { x: 100, y: 40, w: 200, h: 80 };
    const cam = frameRect(400, 200, rect);
    expect((200 - cam.x) / cam.zoom).toBeCloseTo(rect.x + rect.w / 2);
    expect((100 - cam.y) / cam.zoom).toBeCloseTo(rect.y + rect.h / 2);
  });

  it('fits the full city inside the viewport', () => {
    const cam = fitWorld(800, 500, 3600, 2200);
    expect(cam.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(cam.zoom).toBeLessThanOrEqual(MAX_ZOOM);
    const left = (0 - cam.x) / cam.zoom;
    const top = (0 - cam.y) / cam.zoom;
    expect(left).toBeLessThanOrEqual(0);
    expect(top).toBeLessThanOrEqual(0);
  });

  it('fits the whole city, shoreline included, without a side letterbox', () => {
    const wide = fitCityView(1356, 838, 3600, 2200);
    expect(wide.zoom).toBeCloseTo(Math.min(1356 / 3600, 838 / 2200));
    const right = wide.x + 3600 * wide.zoom;
    const bottom = wide.y + 2200 * wide.zoom;
    expect(wide.x).toBeGreaterThanOrEqual(-0.5);
    expect(wide.y).toBeGreaterThanOrEqual(-0.5);
    expect(right).toBeLessThanOrEqual(1356.01);
    expect(bottom).toBeLessThanOrEqual(838.01);
    expect(Math.min(wide.x, 1356 - right)).toBeLessThan(1);
    expect(bottom).toBeCloseTo(838, 0);
    expect(wide.y).toBeGreaterThan(4);
    expect(wide.y).toBeLessThan(24);

    const tall = fitCityView(390, 680, 3600, 2200);
    expect(tall.zoom).toBeCloseTo(390 / 3600);
    expect(tall.x).toBeCloseTo(0);
    expect(tall.x + 3600 * tall.zoom).toBeLessThanOrEqual(390.01);
    const tallBottom = tall.y + 2200 * tall.zoom;
    expect(tall.y).toBeGreaterThan(100);
    expect(tallBottom).toBeLessThanOrEqual(680.01);
    expect(tallBottom).toBeGreaterThan(400);
  });

  it('keeps the city flush with the stage while panning', () => {
    const shoved = clampPan({ x: -10000, y: -10000, zoom: 0.4 }, 800, 500, 3600, 2200);
    expect(shoved.x + 3600 * 0.4).toBeCloseTo(800, 0);
    expect(shoved.y + 2200 * 0.4).toBeCloseTo(500, 0);

    const other = clampPan({ x: 5000, y: 5000, zoom: 0.4 }, 800, 500, 3600, 2200);
    expect(other.x).toBeCloseTo(0, 0);
    expect(other.y).toBeCloseTo(0, 0);

    const fitted = fitCityView(1356, 838, 3600, 2200);
    const nudged = clampPan({ ...fitted, x: fitted.x - 500, y: fitted.y - 500 }, 1356, 838, 3600, 2200);
    expect(nudged.x).toBeCloseTo(fitted.x, 0);
    expect(Math.abs(nudged.y - fitted.y)).toBeLessThan(30);
  });
});
