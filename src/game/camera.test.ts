import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, clampZoom, fitCityView, fitWorld, frameRect, zoomAt } from './camera';

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

  it('reserves top chrome on a wide map without shrinking a tall one', () => {
    const wide = fitCityView(1440, 780, 3600, 2200);
    expect(wide.y).toBeGreaterThanOrEqual(100);
    expect(wide.y + 2200 * wide.zoom).toBeLessThanOrEqual(780);

    const tall = fitCityView(390, 680, 3600, 2200);
    const full = fitWorld(390, 680, 3600, 2200);
    expect(tall.zoom).toBeCloseTo(full.zoom);
    expect(tall.y).toBeGreaterThanOrEqual(0);
    expect(tall.y + 2200 * tall.zoom).toBeLessThanOrEqual(680);
  });
});
