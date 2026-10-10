/** Low enough that a phone-width stage can still fit the full 3600px city. */
export const MIN_ZOOM = 0.08;
export const MAX_ZOOM = 2.6;
/** World pixels that must stay inside the viewport while panning. */
export const PAN_KEEP = 72;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Zoom while keeping the world point under (px, py) fixed on screen. */
export function zoomAt(cam: Camera, px: number, py: number, nextZoom: number): Camera {
  const zoom = clampZoom(nextZoom);
  const worldX = (px - cam.x) / cam.zoom;
  const worldY = (py - cam.y) / cam.zoom;
  return {
    zoom,
    x: px - worldX * zoom,
    y: py - worldY * zoom,
  };
}

export function panBy(cam: Camera, dx: number, dy: number): Camera {
  return { ...cam, x: cam.x + dx, y: cam.y + dy };
}

function clampRange(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

/** Stop a pan or zoom from leaving the city entirely off the stage. */
export function clampPan(cam: Camera, viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  if (viewW < 1 || viewH < 1) return cam;
  const spanX = worldW * cam.zoom;
  const spanY = worldH * cam.zoom;
  const keepX = Math.min(PAN_KEEP, viewW * 0.5);
  const keepY = Math.min(PAN_KEEP, viewH * 0.5);
  return {
    zoom: cam.zoom,
    x: clampRange(cam.x, keepX - spanX, viewW - keepX),
    y: clampRange(cam.y, keepY - spanY, viewH - keepY),
  };
}

export function frameRect(viewW: number, viewH: number, rect: WorldRect, pad = 1.18): Camera {
  const zoom = clampZoom(Math.min(viewW / (rect.w * pad), viewH / (rect.h * pad)));
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return {
    zoom,
    x: viewW / 2 - cx * zoom,
    y: viewH / 2 - cy * zoom,
  };
}

export function fitWorld(viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  return frameRect(viewW, viewH, { x: 0, y: 0, w: worldW, h: worldH }, 1.02);
}

/**
 * Fit the whole world, shoreline included, to the stage.
 * The city and the viewport share one aspect, so this leaves only the
 * remainder on the longer axis instead of letterboxing a reserved header.
 */
export function fitCityView(viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  return frameRect(viewW, viewH, { x: 0, y: 0, w: worldW, h: worldH }, 1);
}
