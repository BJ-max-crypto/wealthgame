export const MIN_ZOOM = 0.16;
export const MAX_ZOOM = 2.6;

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
