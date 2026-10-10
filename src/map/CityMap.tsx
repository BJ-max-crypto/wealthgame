import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { BUILDINGS } from '../data/buildings';
import { DISTRICTS, WORLD } from '../data/layout';
import { clampPan, fitCityView, frameRect, panBy, zoomAt, type Camera, type WorldRect } from '../game/camera';
import { districtLabel, formatMoney, propertyStatus } from '../game/economy';
import type { GameState, Ownership } from '../game/types';
import { BuildingGraphic } from './art';
import { Minimap } from './Minimap';
import { Roads } from './roads';
import { MapDefs, Scenery, Traffic } from './scenery';

function fitCity(viewW: number, viewH: number): Camera {
  return fitCityView(viewW, viewH, WORLD.width, WORLD.height);
}

function settle(cam: Camera, viewW: number, viewH: number): Camera {
  return clampPan(cam, viewW, viewH, WORLD.width, WORLD.height);
}

function labelStyle(cam: Camera, x: number, y: number, size: number): CSSProperties {
  return {
    left: cam.x + x * cam.zoom,
    top: cam.y + y * cam.zoom,
    fontSize: size * cam.zoom,
    transform: 'translate(-50%, -50%)',
  };
}

const ROAD_LABELS: Array<{ name: string; x: number; y: number; vertical: boolean }> = [
  { name: 'Broadway', x: 280, y: 680, vertical: false },
  { name: 'Market Street', x: 1680, y: 1252, vertical: false },
  { name: 'Harbor Road', x: 1500, y: 1789, vertical: false },
  { name: 'Main Street', x: 1792, y: 400, vertical: true },
];

function statusLine(status: Ownership, price: number, rival?: string): string {
  if (status === 'owned') return 'Owned by you';
  if (status === 'rival') return rival ?? 'Owned by a rival';
  if (status === 'locked') return 'Locked';
  return `For sale · ${formatMoney(price)}`;
}

export function CityMap({
  state,
  selectedId,
  onSelect,
}: {
  state: GameState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const userAdjusted = useRef(false);
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, zoom: 0.32 });
  const [view, setView] = useState({ w: 960, h: 640 });
  const [smooth, setSmooth] = useState(false);
  const [panning, setPanning] = useState(false);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const applySize = () => {
      const bounds = el.getBoundingClientRect();
      if (bounds.width < 40 || bounds.height < 40) return;
      setView({ w: bounds.width, h: bounds.height });
      setSmooth(false);
      setCam((current) =>
        userAdjusted.current ? settle(current, bounds.width, bounds.height) : fitCity(bounds.width, bounds.height),
      );
    };
    applySize();
    const observer = new ResizeObserver(applySize);
    observer.observe(el);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      const delta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * bounds.height : event.deltaY;
      const factor = Math.exp(-delta * 0.0014);
      userAdjusted.current = true;
      setSmooth(false);
      setCam((current) =>
        settle(
          zoomAt(current, event.clientX - bounds.left, event.clientY - bounds.top, current.zoom * factor),
          bounds.width,
          bounds.height,
        ),
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  function frame(rect: WorldRect, pad?: number) {
    const el = stageRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    userAdjusted.current = true;
    setSmooth(true);
    setCam(settle(frameRect(bounds.width, bounds.height, rect, pad), bounds.width, bounds.height));
  }

  function resetView() {
    const el = stageRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    userAdjusted.current = false;
    setSmooth(true);
    setCam(fitCity(bounds.width, bounds.height));
  }

  function zoomBy(factor: number) {
    const el = stageRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    userAdjusted.current = true;
    setSmooth(true);
    setCam((current) =>
      settle(zoomAt(current, bounds.width / 2, bounds.height / 2, current.zoom * factor), bounds.width, bounds.height),
    );
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
    setPanning(true);
    setSmooth(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (!moved.current && Math.hypot(dx, dy) < 5) return;
    moved.current = true;
    drag.current = { x: event.clientX, y: event.clientY };
    setTip(null);
    userAdjusted.current = true;
    setCam((current) => settle(panBy(current, dx, dy), view.w, view.h));
  }

  function onPointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const wasDrag = moved.current;
    drag.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (wasDrag) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const node = target instanceof Element ? target.closest('[data-testid^="building-"]') : null;
    const id = node?.getAttribute('data-testid')?.replace(/^building-/, '') ?? null;
    onSelect(id);
  }

  function showTip(event: ReactPointerEvent<SVGGElement>, id: string) {
    if (drag.current) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTip({ id, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  }

  const hovered = tip ? BUILDINGS.find((building) => building.id === tip.id) : undefined;
  const objective = state.owned.length === 0;

  return (
    <div className="city-stage" ref={stageRef}>
      <svg
        className={`city-svg${panning ? ' is-panning' : ''}`}
        data-testid="city-map"
        role="application"
        aria-label="Asher Bay city map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
            transformOrigin: '0 0',
            transition: smooth ? 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          }}
        >
          <MapDefs />
          <rect width={WORLD.width} height={WORLD.height} fill="transparent" />
          <Scenery />
          <Roads />
          <Traffic />
          {BUILDINGS.map((def) => {
            const owned = state.owned.find((entry) => entry.id === def.id);
            return (
              <BuildingGraphic
                key={def.id}
                def={def}
                status={propertyStatus(state, def)}
                level={owned?.level ?? 1}
                detail={cam.zoom >= 0.42}
                selected={selectedId === def.id}
                onSelect={() => onSelect(def.id)}
                onHover={(event) => showTip(event, def.id)}
                onLeave={() => setTip((current) => (current?.id === def.id ? null : current))}
              />
            );
          })}
        </g>
      </svg>

      <div className="map-top">
        <div className="district-chips" role="navigation" aria-label="Districts">
          {DISTRICTS.map((district) => (
            <button key={district.id} type="button" onClick={() => frame(district)}>
              {district.short}
            </button>
          ))}
        </div>
        {objective && (
          <p className="objective">
            Trade first, then buy Night Owl Market for $580. Coffee and steel are below their usual prices.
          </p>
        )}
        <div className="map-tools">
          <button type="button" data-testid="zoom-in" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
            +
          </button>
          <span className="zoom-readout">{Math.round(cam.zoom * 100)}%</span>
          <button type="button" data-testid="zoom-out" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">
            −
          </button>
          <button type="button" data-testid="zoom-reset" onClick={resetView} aria-label="Reset to city view">
            City
          </button>
        </div>
      </div>

      <Minimap
        cam={cam}
        viewW={view.w}
        viewH={view.h}
        onFocus={(worldX, worldY) => frame({ x: worldX - 200, y: worldY - 140, w: 400, h: 280 }, 1)}
      />

      <div className="map-labels" aria-hidden="true">
        {cam.zoom >= 0.2 &&
          cam.zoom < 1.15 &&
          DISTRICTS.map((district) => (
            <span key={district.id} className="district-label" style={labelStyle(cam, district.label.x, district.label.y, 34)}>
              {district.name}
            </span>
          ))}
        {cam.zoom >= 0.2 && cam.zoom < 0.85 && (
          <span className="water-label" style={labelStyle(cam, 1280, 2088, 56)}>
            Asher Bay
          </span>
        )}
        {cam.zoom >= 0.55 && cam.zoom < 1.5 && (
          <span className="place-label" style={labelStyle(cam, 2140, 1124, 28)}>
            Exchange Square
          </span>
        )}
        {cam.zoom >= 0.2 && cam.zoom < 1.15 && (
          <span className="place-label" style={labelStyle(cam, 3280, 500, 28)}>
            North Bluff
          </span>
        )}
        {cam.zoom >= 0.95 &&
          ROAD_LABELS.map((road) => (
            <span
              key={road.name}
              className={road.vertical ? 'road-label is-vertical' : 'road-label'}
              style={labelStyle(cam, road.x, road.y, 26)}
            >
              {road.name}
            </span>
          ))}
        {cam.zoom >= 1 &&
          BUILDINGS.map((def) => (
            <span
              key={def.id}
              className="building-label"
              style={{
                ...labelStyle(cam, def.x + def.w / 2, def.y, 22),
                transform: 'translate(-50%, -120%)',
              }}
            >
              {def.short}
            </span>
          ))}
      </div>

      {hovered && tip && (
        <div
          className="map-tip"
          style={{
            left: Math.min(tip.x + 14, Math.max(8, view.w - 220)),
            top: Math.min(tip.y + 16, Math.max(8, view.h - 72)),
          }}
        >
          <strong>{hovered.name}</strong>
          <span>
            {districtLabel(hovered.districtId)} · {statusLine(propertyStatus(state, hovered), hovered.price, hovered.rivalName)}
          </span>
        </div>
      )}
    </div>
  );
}
