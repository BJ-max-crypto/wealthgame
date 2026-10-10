import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BUILDINGS } from '../data/buildings';
import { DISTRICTS, WORLD } from '../data/layout';
import { fitCityView, frameRect, panBy, zoomAt, type Camera, type WorldRect } from '../game/camera';
import { districtLabel, formatMoney, propertyStatus } from '../game/economy';
import type { GameState, Ownership } from '../game/types';
import { BuildingGraphic } from './art';
import { Minimap } from './Minimap';
import { Roads } from './roads';
import { MapDefs, Scenery } from './scenery';

function fitCity(viewW: number, viewH: number): Camera {
  return fitCityView(viewW, viewH, WORLD.width, WORLD.height);
}

const ROAD_LABELS = [
  { name: 'Broadway', x: 220, y: 676 },
  { name: 'Market Street', x: 220, y: 1250 },
  { name: 'Harbor Road', x: 220, y: 1788 },
  { name: 'Main Street', x: 1796, y: 250 },
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
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, zoom: 0.32 });
  const [view, setView] = useState({ w: 960, h: 640 });
  const [smooth, setSmooth] = useState(false);
  const [panning, setPanning] = useState(false);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const bounds = el.getBoundingClientRect();
      if (bounds.width < 40 || bounds.height < 40) return false;
      setView({ w: bounds.width, h: bounds.height });
      setCam(fitCity(bounds.width, bounds.height));
      return true;
    };
    if (fit()) return;
    const observer = new ResizeObserver(() => {
      if (fit()) observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const bounds = el.getBoundingClientRect();
      setView({ w: bounds.width, h: bounds.height });
    });
    observer.observe(el);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      const delta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * bounds.height : event.deltaY;
      const factor = Math.exp(-delta * 0.0014);
      setSmooth(false);
      setCam((current) => zoomAt(current, event.clientX - bounds.left, event.clientY - bounds.top, current.zoom * factor));
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
    setSmooth(true);
    setCam(frameRect(bounds.width, bounds.height, rect, pad));
  }

  function resetView() {
    const el = stageRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    setSmooth(true);
    setCam(fitCity(bounds.width, bounds.height));
  }

  function zoomBy(factor: number) {
    const el = stageRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    setSmooth(true);
    setCam((current) => zoomAt(current, bounds.width / 2, bounds.height / 2, current.zoom * factor));
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
    setCam((current) => panBy(current, dx, dy));
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
          {BUILDINGS.map((def) => {
            const owned = state.owned.find((entry) => entry.id === def.id);
            return (
              <BuildingGraphic
                key={def.id}
                def={def}
                status={propertyStatus(state, def)}
                level={owned?.level ?? 1}
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
      </div>

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

      <Minimap
        cam={cam}
        viewW={view.w}
        viewH={view.h}
        onFocus={(worldX, worldY) => frame({ x: worldX - 200, y: worldY - 140, w: 400, h: 280 }, 1)}
      />

      <div className="map-labels" aria-hidden="true">
        {cam.zoom < 1.15 &&
          DISTRICTS.map((district) => (
            <span
              key={district.id}
              className="district-label"
              style={{
                transform: `translate(${cam.x + district.label.x * cam.zoom}px, ${cam.y + district.label.y * cam.zoom}px)`,
              }}
            >
              {district.name}
            </span>
          ))}
        {cam.zoom < 0.85 && (
          <span
            className="water-label"
            style={{ transform: `translate(${cam.x + 860 * cam.zoom}px, ${cam.y + 2060 * cam.zoom}px)` }}
          >
            Asher Bay
          </span>
        )}
        {cam.zoom >= 0.55 && cam.zoom < 1.5 && (
          <span
            className="place-label"
            style={{ transform: `translate(${cam.x + 2140 * cam.zoom}px, ${cam.y + 1164 * cam.zoom}px)` }}
          >
            Exchange Square
          </span>
        )}
        {cam.zoom < 1.15 && (
          <span
            className="place-label"
            style={{ transform: `translate(${cam.x + 2860 * cam.zoom}px, ${cam.y + 180 * cam.zoom}px)` }}
          >
            North Bluff
          </span>
        )}
        {cam.zoom >= 0.95 &&
          ROAD_LABELS.map((road) => (
            <span
              key={road.name}
              className="road-label"
              style={{ transform: `translate(${cam.x + road.x * cam.zoom}px, ${cam.y + road.y * cam.zoom}px)` }}
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
                transform: `translate(${cam.x + (def.x + def.w / 2) * cam.zoom}px, ${cam.y + def.y * cam.zoom}px)`,
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
