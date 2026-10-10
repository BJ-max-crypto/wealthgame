import type { PointerEvent } from 'react';
import type { BuildingDef, DistrictId, Ownership } from '../game/types';

function hash(seed: string, index: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= Math.imul(index + 1, 374761393);
  return h >>> 0;
}

function siteFill(district: DistrictId): string {
  switch (district) {
    case 'downtown':
      return '#efe6d4';
    case 'commercial':
      return '#f6ecda';
    case 'industrial':
      return '#e4e1d8';
    case 'port':
      return '#e6e0d4';
    case 'waterfront':
      return '#e7f0df';
  }
}

function pts(pairs: Array<[number, number]>): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * Oblique block: south face, east face, and roof. The footprint stays inside the lot.
 * `y` is the front-bottom edge. Height grows up the screen, the way the reference city reads.
 */
function Block({
  x,
  y,
  w,
  rise,
  face,
  side,
  roof,
  id,
  detail,
  lit = '#f3d7a2',
  glass = '#102838',
  awning,
  plain = false,
}: {
  x: number;
  y: number;
  w: number;
  rise: number;
  face: string;
  side: string;
  roof: string;
  id: string;
  detail: boolean;
  lit?: string;
  glass?: string;
  awning?: string;
  plain?: boolean;
}) {
  const skew = Math.min(58, Math.max(20, w * 0.22));
  const lift = skew * 0.42;
  const front: Array<[number, number]> = [
    [x, y - rise],
    [x + w, y - rise],
    [x + w, y],
    [x, y],
  ];
  const right: Array<[number, number]> = [
    [x + w, y - rise],
    [x + w + skew, y - rise - lift],
    [x + w + skew, y - lift],
    [x + w, y],
  ];
  const top: Array<[number, number]> = [
    [x, y - rise],
    [x + skew, y - rise - lift],
    [x + w + skew, y - rise - lift],
    [x + w, y - rise],
  ];
  const cols = Math.max(2, Math.min(7, Math.round(w / 28)));
  const rows = Math.max(2, Math.min(8, Math.round(rise / 22)));
  const panes = [];
  if (plain) {
    /* Solid cargo faces stay readable when the box is only a few pixels tall. */
  } else if (detail && rise > 28 && w > 24) {
    const padX = 6;
    const padY = 6;
    const innerW = w - padX * 2;
    const innerH = rise - padY * 2;
    const gapX = 3;
    const gapY = 3;
    const cellW = (innerW - gapX * (cols - 1)) / cols;
    const cellH = (innerH - gapY * (rows - 1)) / rows;
    let n = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const on = hash(id, n) % 6 === 0;
        panes.push(
          <rect
            key={n}
            x={x + padX + col * (cellW + gapX)}
            y={y - rise + padY + row * (cellH + gapY)}
            width={Math.max(1, cellW)}
            height={Math.max(1, cellH)}
            fill={on ? lit : glass}
          />,
        );
        n += 1;
      }
    }
  } else if (rise > 24) {
    panes.push(
      <rect key="a" x={x + 5} y={y - rise + rise * 0.18} width={w - 10} height={Math.max(3, rise * 0.12)} fill={glass} />,
      <rect key="b" x={x + 5} y={y - rise + rise * 0.46} width={w - 10} height={Math.max(3, rise * 0.12)} fill={glass} />,
      <rect key="c" x={x + w * 0.18} y={y - rise + rise * 0.2} width={Math.max(4, w * 0.12)} height={Math.max(3, rise * 0.08)} fill={lit} />,
    );
  }
  const sidePanes =
    plain || rise < 36
      ? null
      : Array.from({ length: Math.min(4, Math.max(2, Math.round(rise / 48))) }, (_, index) => {
          const t = 0.22 + index * 0.18;
          return (
            <line
              key={index}
              x1={x + w + skew * 0.22}
              y1={y - rise * t}
              x2={x + w + skew * 0.78}
              y2={y - rise * t - lift * 0.55}
              stroke={glass}
              strokeWidth={Math.max(2, w * 0.035)}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        });
  return (
    <g>
      <ellipse cx={x + w * 0.55 + skew * 0.3} cy={y + 5} rx={w * 0.46} ry={8} fill="#102028" opacity={0.2} />
      <polygon points={pts(right)} fill={side} />
      {sidePanes}
      <polygon points={pts(front)} fill={face} />
      {panes}
      {awning && (
        <g>
          <polygon
            points={pts([
              [x - 2, y - rise * 0.42],
              [x + w + 4, y - rise * 0.42],
              [x + w + 8, y - rise * 0.42 + 12],
              [x - 6, y - rise * 0.42 + 12],
            ])}
            fill={awning}
          />
          {Array.from({ length: Math.max(3, Math.round(w / 16)) }, (_, index) => {
            const count = Math.max(3, Math.round(w / 16));
            const stripe = (w + 14) / count;
            return (
              <rect
                key={index}
                x={x - 4 + index * stripe}
                y={y - rise * 0.42}
                width={Math.max(1, stripe - 1.4)}
                height={12}
                fill={index % 2 === 0 ? awning : '#f7f3ea'}
              />
            );
          })}
        </g>
      )}
      <polygon points={pts(top)} fill={roof} />
      <polygon points={pts(top)} fill="#ffffff" opacity={0.08} />
    </g>
  );
}

function place(lotW: number, lotH: number, foot: number, rise: number) {
  const skew = Math.min(58, Math.max(20, foot * 0.22));
  const w = Math.min(foot, lotW - skew - 16);
  const x = Math.max(8, (lotW - w - skew) / 2);
  const y = lotH - 10;
  const height = Math.max(24, Math.min(rise, y - 18));
  return { x, y, w, rise: height };
}

function Lot({ def }: { def: BuildingDef }) {
  return <rect width={def.w} height={def.h} fill={siteFill(def.districtId)} />;
}

function LoftArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.72, def.h * 0.42 * (1 + (level - 1) * 0.12));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#c46a4a" side="#8d4632" roof="#e7c9a4" id={def.id} detail={detail} glass="#6a3030" />
    </g>
  );
}

function OfficeArt({
  def,
  detail,
  level,
  heli = false,
}: {
  def: BuildingDef;
  detail: boolean;
  level: number;
  heli?: boolean;
}) {
  const box = place(def.w, def.h, def.w * 0.8, def.h * 0.84 * (1 + (level - 1) * 0.08));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#1c4d6e" side="#12344c" roof="#d5e4ea" id={def.id} detail={detail} />
      {heli && detail && (
        <g>
          <circle cx={box.x + box.w * 0.45} cy={box.y - box.rise - 8} r={14} fill="#245066" stroke="#d5e6ee" strokeWidth={1.4} />
          <text x={box.x + box.w * 0.45} y={box.y - box.rise - 4} textAnchor="middle" fontSize={11} fill="#e7f3f6" fontFamily="Outfit, sans-serif">
            H
          </text>
        </g>
      )}
      {level >= 3 && <rect x={box.x + box.w * 0.7} y={box.y - box.rise - 16} width={3} height={16} fill="#5c6570" />}
    </g>
  );
}

function HeadquartersArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const base = def.h - 14;
  const bonus = 1 + (level - 1) * 0.06;
  const towers = [
    { x: 36, w: 150, rise: 250 * bonus, face: '#1a4060', side: '#102838', roof: '#c5d5de' },
    { x: 210, w: 250, rise: 360 * bonus, face: '#16324c', side: '#0e2436', roof: '#d7c27a' },
    { x: 490, w: 150, rise: 280 * bonus, face: '#1e4a68', side: '#122c40', roof: '#c5d5de' },
  ];
  return (
    <g>
      <Lot def={def} />
      <rect x={48} y={base - 36} width={def.w - 110} height={28} fill="#d9d3c6" />
      {towers.map((tower, index) => (
        <Block
          key={tower.x}
          x={tower.x}
          y={base}
          w={tower.w}
          rise={Math.min(tower.rise, base - 20)}
          face={tower.face}
          side={tower.side}
          roof={tower.roof}
          id={`${def.id}-${index}`}
          detail={detail}
        />
      ))}
      {detail && (
        <text x={335} y={base - 300} textAnchor="middle" fontSize={16} letterSpacing={3} fill="#e7d7a8" fontFamily="Outfit, sans-serif">
          APEX
        </text>
      )}
    </g>
  );
}

function ShopArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.78, def.h * 0.38 * (1 + (level - 1) * 0.1));
  const sign = Math.max(8, Math.min(13, (box.w - 12) / Math.max(def.short.length * 0.58, 1)));
  return (
    <g>
      <Lot def={def} />
      <Block
        {...box}
        face="#f7f1e6"
        side="#d9d0c2"
        roof="#e7e0d4"
        id={def.id}
        detail={detail}
        glass="#163246"
        awning={def.accent}
      />
      {detail && (
        <text
          x={box.x + box.w / 2}
          y={box.y - box.rise * 0.22}
          textAnchor="middle"
          fontSize={sign}
          fill="#243140"
          fontFamily="Outfit, sans-serif"
          fontWeight={600}
        >
          {def.short}
        </text>
      )}
    </g>
  );
}

function DinerArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.8, def.h * 0.4 * (1 + (level - 1) * 0.1));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#d24b3a" side="#9a3028" roof="#f4efe6" id={def.id} detail={detail} glass="#f7f4ee" lit="#9fd0dc" />
      {detail && (
        <text x={box.x + box.w / 2} y={box.y - box.rise - 6} textAnchor="middle" fontSize={12} fill="#a33b32" fontFamily="Outfit, sans-serif" fontWeight={700}>
          DINER
        </text>
      )}
    </g>
  );
}

function FactoryArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.84, def.h * 0.34 * (1 + (level - 1) * 0.08));
  const teeth = def.w > 320 ? 4 : 3;
  const tooth = box.w / teeth;
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#6d7580" side="#4e565f" roof="#9aa3ab" id={def.id} detail={detail} glass="#1c2830" />
      {Array.from({ length: teeth }, (_, index) => {
        const x = box.x + index * tooth + 4;
        const peak = box.y - box.rise - 18 - (level - 1) * 4;
        return (
          <polygon
            key={index}
            points={pts([
              [x, box.y - box.rise],
              [x + tooth * 0.45, peak],
              [x + tooth - 8, box.y - box.rise],
            ])}
            fill={index % 2 ? '#7c858e' : '#8e979f'}
          />
        );
      })}
      <rect x={box.x + box.w * 0.78} y={box.y - box.rise - 36} width={14} height={40} fill="#3e4650" />
      <circle cx={box.x + box.w * 0.78 + 8} cy={box.y - box.rise - 40} r={8} fill="#d5dde2" opacity={0.8} />
    </g>
  );
}

function WarehouseArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.86, def.h * 0.46 * (1 + (level - 1) * 0.08));
  const doors = Math.max(2, Math.round(box.w / 70));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#b7b1a4" side="#8d877c" roof="#d5cfc2" id={def.id} detail={detail} glass="#2c333c" />
      {Array.from({ length: doors }, (_, index) => (
        <rect
          key={index}
          x={box.x + 8 + index * ((box.w - 16) / doors)}
          y={box.y - 16}
          width={(box.w - 16) / doors - 6}
          height={14}
          fill="#2c333c"
        />
      ))}
    </g>
  );
}

function PierArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.84, def.h * 0.42 * (1 + (level - 1) * 0.08));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#7d8b98" side="#5c6976" roof="#c5ced6" id={def.id} detail={detail} glass="#243640" />
      <rect x={box.x} y={box.y - box.rise} width={8} height={box.rise} fill={def.accent} />
    </g>
  );
}

const BOX_COLORS = ['#d24b3a', '#1f6f9a', '#e07a32', '#3e7a4a', '#2f8f9a', '#d1a24a', '#f4efe6', '#3d4f73'];
const BOX_SIDES = ['#9a3028', '#154e6e', '#a85620', '#2a5634', '#1f6570', '#8d6a28', '#c9c3b6', '#2a384f'];

function ContainerArt({ def }: { def: BuildingDef }) {
  const colW = 52;
  const rowH = 34;
  const cols = Math.max(2, Math.floor((def.w - 24) / (colW + 6)));
  const rows = Math.max(2, Math.floor((def.h - 16) / (rowH + 6)));
  const boxes = [];
  let n = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = n % BOX_COLORS.length;
      const x = 10 + col * (colW + 8);
      const y = 18 + row * (rowH + 8) + rowH;
      boxes.push(
        <Block
          key={n}
          x={x}
          y={y}
          w={colW}
          rise={rowH}
          face={BOX_COLORS[index] ?? '#d24b3a'}
          side={BOX_SIDES[index] ?? '#9a3028'}
          roof={BOX_COLORS[index] ?? '#d24b3a'}
          id={`${def.id}-${n}`}
          detail={false}
          plain
        />,
      );
      n += 1;
    }
  }
  return (
    <g>
      <rect width={def.w} height={def.h} fill="#cfc6b4" />
      {boxes}
    </g>
  );
}

function CraneArt({ def, level }: { def: BuildingDef; level: number }) {
  const { w, h } = def;
  const mast = w * 0.34;
  const top = 16 - (level - 1) * 4;
  return (
    <g>
      <rect width={w} height={h} fill="#d9d2c4" />
      <rect x={10} y={h - 28} width={w * 0.55} height={18} fill="#5c6570" />
      <rect x={mast} y={top} width={14} height={h - top - 16} fill="#e07a32" />
      <rect x={mast - 8} y={h - 34} width={30} height={12} fill="#b85a22" />
      <polygon points={`${mast},${top + 8} ${w - 10},${top + 22} ${w - 10},${top + 34} ${mast + 14},${top + 22}`} fill="#f09a4a" />
      <polygon points={`${mast + 4},${top + 16} ${mast - 28},${top + 28} ${mast - 28},${top + 36} ${mast + 14},${top + 26}`} fill="#c45e1e" />
      <rect x={mast - 26} y={top + 10} width={22} height={14} fill="#2c333c" />
      <line x1={w - 18} y1={top + 28} x2={w - 18} y2={h - 30} stroke="#1c2430" strokeWidth={2} />
      <rect x={w - 30} y={h - 36} width={24} height={12} fill="#d24b3a" />
    </g>
  );
}

function MarinaArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.7, def.h * 0.36 * (1 + (level - 1) * 0.08));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#f7f4ee" side="#d9d0c2" roof={def.accent} id={def.id} detail={detail} />
      <g transform={`translate(${def.w * 0.62} ${def.h - 36})`}>
        <path d="M0,10 C20,2 70,2 92,10 L84,18 L8,18 Z" fill="#f7f4ee" stroke="#8aa0aa" />
        <rect x={36} y={-6} width={22} height={14} fill="#1e4d6b" />
        <rect x={40} y={-2} width={14} height={6} fill="#9fd0dc" />
      </g>
    </g>
  );
}

function RestaurantArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w, def.h, def.w * 0.74, def.h * 0.34 * (1 + (level - 1) * 0.1));
  return (
    <g>
      <Lot def={def} />
      <Block {...box} face="#f6f1e8" side="#e0d4c4" roof="#e07a32" id={def.id} detail={detail} awning={def.accent} />
      {Array.from({ length: 3 }, (_, index) => (
        <g key={index} transform={`translate(${18 + index * ((def.w - 50) / 2)} ${def.h - 28})`}>
          <rect x={-8} y={2} width={16} height={3} fill="#c4a37a" />
          <circle cx={0} cy={0} r={7} fill="#f7f4ee" />
          <circle cx={0} cy={0} r={2} fill={def.accent} />
        </g>
      ))}
    </g>
  );
}

function BoatRentalArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w * 0.55, def.h, def.w * 0.4, def.h * 0.4 * (1 + (level - 1) * 0.08));
  const hulls = ['#d24b3a', '#1f8f9a', '#e0a03a', '#3e7a4a'];
  return (
    <g>
      <Lot def={def} />
      <Block {...box} x={12} face="#f7f4ee" side="#ddd4c6" roof={def.accent} id={def.id} detail={detail} />
      {hulls.map((color, index) => (
        <path
          key={color}
          d={`M${def.w * 0.55},${40 + index * 28} c16,-6 48,-6 64,0 l-6,8 h-52 z`}
          fill={color}
        />
      ))}
    </g>
  );
}

function ResortArt({ def, detail, level }: { def: BuildingDef; detail: boolean; level: number }) {
  const box = place(def.w * 0.7, def.h, def.w * 0.48, def.h * 0.42 * (1 + (level - 1) * 0.1));
  return (
    <g>
      <Lot def={def} />
      <ellipse cx={def.w * 0.28} cy={def.h - 28} rx={def.w * 0.2} ry={14} fill="#7ebfd0" />
      <Block {...box} x={14} face="#f7f3ea" side="#e4d9c8" roof="#1e3a5f" id={def.id} detail={detail} />
      <g transform={`translate(${def.w * 0.68} ${def.h * 0.28})`}>
        <rect x={0} y={0} width={26} height={def.h * 0.55} fill="#f4efe6" />
        {Array.from({ length: 4 }, (_, index) => (
          <rect key={index} x={0} y={10 + index * 22} width={26} height={8} fill="#d24b3a" />
        ))}
        <polygon points="-4,0 13,-16 30,0" fill="#1e3a5f" />
      </g>
    </g>
  );
}

function renderArt(def: BuildingDef, detail: boolean, level: number) {
  switch (def.art) {
    case 'loft':
      return <LoftArt def={def} detail={detail} level={level} />;
    case 'office':
      return <OfficeArt def={def} heli={def.id === 'harborview-tower'} detail={detail} level={level} />;
    case 'hq':
      return <HeadquartersArt def={def} detail={detail} level={level} />;
    case 'shop':
      return <ShopArt def={def} detail={detail} level={level} />;
    case 'diner':
      return <DinerArt def={def} detail={detail} level={level} />;
    case 'factory':
      return <FactoryArt def={def} detail={detail} level={level} />;
    case 'warehouse':
      return <WarehouseArt def={def} detail={detail} level={level} />;
    case 'pier':
      return <PierArt def={def} detail={detail} level={level} />;
    case 'containers':
      return <ContainerArt def={def} />;
    case 'crane':
      return <CraneArt def={def} level={level} />;
    case 'marina':
      return <MarinaArt def={def} detail={detail} level={level} />;
    case 'restaurant':
      return <RestaurantArt def={def} detail={detail} level={level} />;
    case 'boats':
      return <BoatRentalArt def={def} detail={detail} level={level} />;
    case 'resort':
      return <ResortArt def={def} detail={detail} level={level} />;
  }
}

const STATUS_COLOR: Record<Ownership, string> = {
  available: '#e0b15a',
  owned: '#2f9d6c',
  rival: '#8d5a3c',
  locked: '#8b919a',
};

function StatusMark({ status, w }: { status: Ownership; w: number }) {
  const size = 22;
  const x = w - size - 6;
  const y = 6;
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={size} height={size} fill={STATUS_COLOR[status]} />
      {status === 'available' && <rect x={x + 4} y={y + 9} width={14} height={3} fill="#1c2430" />}
      {status === 'owned' && <rect x={x + 5} y={y + 5} width={12} height={12} fill="#e7f6ee" />}
      {status === 'rival' && <polygon points={`${x + 11},${y + 4} ${x + 18},${y + 11} ${x + 11},${y + 18} ${x + 4},${y + 11}`} fill="#f6efe6" />}
      {status === 'locked' && (
        <g>
          <rect x={x + 6} y={y + 10} width={10} height={7} fill="#f4efe6" />
          <path d={`M${x + 8},${y + 10} V${y + 7} H${x + 14} V${y + 10}`} fill="none" stroke="#f4efe6" strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
}

export function BuildingGraphic({
  def,
  status,
  level,
  detail,
  selected,
  onSelect,
  onHover,
  onLeave,
}: {
  def: BuildingDef;
  status: Ownership;
  level: number;
  detail: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: (event: PointerEvent<SVGGElement>) => void;
  onLeave: () => void;
}) {
  const built = status === 'owned' ? level : 1;
  return (
    <g
      className={`bld is-${status}${selected ? ' is-selected' : ''}`}
      transform={`translate(${def.x} ${def.y})`}
      data-testid={`building-${def.id}`}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`${def.name}, ${status}${status === 'owned' ? `, level ${level}` : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
    >
      <ellipse cx={def.w / 2} cy={def.h - 4} rx={def.w * 0.36} ry={6} fill="#1a2430" opacity={0.16} />
      {renderArt(def, detail, built)}
      <StatusMark status={status} w={def.w} />
      <rect className="lot-outline" x={0.5} y={0.5} width={def.w - 1} height={def.h - 1} fill="transparent" />
    </g>
  );
}
