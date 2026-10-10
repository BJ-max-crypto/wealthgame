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

function clampAxis(value: number, span: number, view: number, pinEnd: boolean): number {
  if (span >= view - 24) {
    const min = Math.min(0, view - span);
    const max = Math.max(0, view - span);
    if (pinEnd && span >= view && span - view <= 8) return min;
    return clampRange(value, min, max);
  }
  const keep = Math.min(span * 0.85, Math.max(PAN_KEEP, view * 0.4));
  return clampRange(value, keep - span, view - keep);
}

/** Keep the city on the stage. A map that can fill the view stays flush with its edges. */
export function clampPan(cam: Camera, viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  if (viewW < 1 || viewH < 1) return cam;
  return {
    zoom: cam.zoom,
    x: clampAxis(cam.x, worldW * cam.zoom, viewW, false),
    y: clampAxis(cam.y, worldH * cam.zoom, viewH, true),
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
 * A laptop-shaped view is nearly the city's aspect, so the shoreline sits on
 * the bottom edge. A tall phone keeps the city centered, because the extra
 * space is the only way to show the full width.
 */
export function fitCityView(viewW: number, viewH: number, worldW: number, worldH: number): Camera {
  const zoom = clampZoom(Math.min(viewW / worldW, viewH / worldH));
  const spanW = worldW * zoom;
  const spanH = worldH * zoom;
  const slackY = Math.max(0, viewH - spanH);
  return {
    zoom,
    x: (viewW - spanW) / 2,
    y: slackY < 48 ? slackY : slackY / 2,
  };
}
