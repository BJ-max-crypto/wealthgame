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
      return '#f4eee3';
    case 'commercial':
      return '#f7efe2';
    case 'industrial':
      return '#e6e3db';
    case 'port':
      return '#e8e3d7';
    case 'waterfront':
      return '#eaf3e1';
  }
}

function Windows({
  id,
  x,
  y,
  w,
  h,
  cols,
  rows,
  detail,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  detail: boolean;
}) {
  if (!detail) {
    return (
      <g>
        <rect x={x + 4} y={y + h * 0.18} width={w - 8} height={Math.max(3, h * 0.16)} fill="#102834" />
        <rect x={x + 4} y={y + h * 0.48} width={w - 8} height={Math.max(3, h * 0.16)} fill="#102834" />
        <rect x={x + w * 0.18} y={y + h * 0.2} width={Math.max(4, w * 0.1)} height={Math.max(3, h * 0.12)} fill="#f3d7a2" />
      </g>
    );
  }
  const gapX = Math.max(2, w * 0.045);
  const gapY = Math.max(2, h * 0.1);
  const cellW = (w - gapX * (cols + 1)) / cols;
  const cellH = (h - gapY * (rows + 1)) / rows;
  const cells = [];
  let n = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const lit = hash(id, n) % 5 === 0;
      cells.push(
        <rect
          key={n}
          x={x + gapX + col * (cellW + gapX)}
          y={y + gapY + row * (cellH + gapY)}
          width={Math.max(1, cellW)}
          height={Math.max(1, cellH)}
          fill={lit ? '#f3d7a2' : '#143646'}
        />,
      );
      n += 1;
    }
  }
  return <g>{cells}</g>;
}

function OfficeArt({ def, heli = false, detail }: { def: BuildingDef; heli?: boolean; detail: boolean }) {
  const { w, h, accent, id } = def;
  const margin = 14;
  const width = w - margin * 2;
  const faceH = Math.max(52, Math.min(h * 0.46, 150));
  const roofH = Math.max(36, h - faceH - 28);
  const cols = Math.max(3, Math.min(6, Math.round(width / 42)));
  const rows = Math.max(3, Math.min(7, Math.round(faceH / 24)));
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill={siteFill(def.districtId)} />
      <ellipse cx={w / 2 + 6} cy={h - 8} rx={width * 0.4} ry={7} fill="#1a2430" opacity={0.14} />
      <rect x={margin + width / 2 - 3} y={0} width={5} height={18} fill="#2c333c" />
      <rect x={margin} y={14} width={width} height={roofH} fill={accent} />
      <rect x={margin} y={14} width={width} height={Math.max(8, roofH * 0.16)} fill="#ffffff" opacity={0.16} />
      <rect x={margin + width * 0.36} y={20} width={width * 0.28} height={Math.min(26, roofH * 0.4)} fill="#243846" />
      <rect x={margin + width * 0.68} y={22} width={18} height={12} fill="#b7c3cc" />
      {heli && (
        <g>
          <circle cx={margin + width * 0.28} cy={22 + roofH * 0.55} r={16} fill="#245066" stroke="#d5e6ee" strokeWidth={1.6} />
          <text x={margin + width * 0.28} y={27 + roofH * 0.55} textAnchor="middle" fontSize={13} fill="#e7f3f6" fontFamily="Outfit, sans-serif">
            H
          </text>
        </g>
      )}
      <rect x={margin} y={14 + roofH} width={width} height={faceH} fill="#1a3142" />
      <Windows id={id} x={margin} y={14 + roofH} w={width} h={faceH - 8} cols={cols} rows={rows} detail={detail} />
      <rect x={margin + width / 2 - 10} y={14 + roofH + faceH - 14} width={20} height={14} fill="#c6a15a" />
      <rect x={margin + 8} y={h - 18} width={width - 16} height={6} fill="#d9d0c2" />
    </g>
  );
}

function LoftArt({ def, detail }: { def: BuildingDef; detail: boolean }) {
  const { w, h, id } = def;
  return (
    <g>
      <rect width={w} height={h} fill={siteFill(def.districtId)} />
      <rect x={18} y={16} width={w - 36} height={h * 0.46} fill="#a85b45" />
      <rect x={18} y={16} width={w - 36} height={8} fill="#c47860" />
      <rect x={w * 0.62} y={24} width={22} height={12} fill="#8d99a3" />
      <rect x={18} y={16 + h * 0.46} width={w - 36} height={h * 0.28} fill="#f3e6d4" />
      <Windows id={id} x={18} y={16 + h * 0.46} w={w - 36} h={h * 0.28} cols={4} rows={2} detail={detail} />
      <rect x={w / 2 - 10} y={16 + h * 0.68} width={20} height={12} fill="#5c4636" />
      <rect x={28} y={h - 22} width={w - 56} height={8} fill="#ded3c2" />
    </g>
  );
}

function HeadquartersArt({ def, detail }: { def: BuildingDef; detail: boolean }) {
  const { w, h } = def;
  const left = 28;
  const top = 18;
  const width = w - 56;
  const height = h - 48;
  return (
    <g>
      <rect width={w} height={h} fill="#efe6d6" />
      <ellipse cx={w / 2} cy={h - 10} rx={w * 0.36} ry={8} fill="#1a2430" opacity={0.13} />
      <rect x={left} y={top + height * 0.22} width={width * 0.28} height={height * 0.62} fill="#24425e" />
      <rect x={left + width * 0.72} y={top + height * 0.22} width={width * 0.28} height={height * 0.62} fill="#24425e" />
      <rect x={left + width * 0.18} y={top} width={width * 0.64} height={height * 0.78} fill="#1b3550" />
      <rect x={left + width * 0.18} y={top} width={width * 0.64} height={10} fill="#c6a15a" />
      <rect x={left + width * 0.34} y={top + 16} width={width * 0.32} height={height * 0.16} fill="#14283c" />
      <text
        x={left + width / 2}
        y={top + height * 0.3}
        textAnchor="middle"
        fontSize={18}
        letterSpacing={3}
        fill="#e7d7a8"
        fontFamily="Outfit, sans-serif"
      >
        APEX
      </text>
      <rect x={left + width * 0.38} y={top + height * 0.72} width={width * 0.24} height={height * 0.2} fill="#d9c7a2" />
      <circle cx={left + width / 2} cy={top + height * 0.9} r={10} fill="#1b3550" />
      <rect x={left + width * 0.7} y={top - 10} width={3} height={22} fill="#5c6570" />
      <polygon points={`${left + width * 0.7},8 ${left + width * 0.7 + 16},12 ${left + width * 0.7},16`} fill="#c6a15a" />
      <Windows id="apex-left" x={left + 6} y={top + height * 0.3} w={width * 0.28 - 12} h={height * 0.42} cols={3} rows={4} detail={detail} />
      <Windows id="apex-right" x={left + width * 0.72 + 6} y={top + height * 0.3} w={width * 0.28 - 12} h={height * 0.42} cols={3} rows={4} detail={detail} />
      <Windows id="apex-center" x={left + width * 0.24} y={top + height * 0.36} w={width * 0.52} h={height * 0.28} cols={6} rows={3} detail={detail} />
    </g>
  );
}

function ShopArt({ def, detail }: { def: BuildingDef; detail: boolean }) {
  const { w, h, accent, short, id } = def;
  const margin = 14;
  const bw = w - margin * 2;
  const roofH = h * 0.34;
  const faceH = h * 0.24;
  const signSize = Math.max(9, Math.min(14, (bw - 16) / Math.max(short.length * 0.58, 1)));
  const stripes = Math.max(4, Math.round(bw / 18));
  const stripeW = (bw + 6) / stripes;
  return (
    <g>
      <rect width={w} height={h} fill={siteFill(def.districtId)} />
      <rect x={margin} y={12} width={bw} height={roofH} fill="#d8cebf" />
      <rect x={margin + bw * 0.62} y={18} width={18} height={10} fill="#9aa4ad" />
      <rect x={margin + bw * 0.2} y={20} width={22} height={8} fill="#b9aa96" />
      <rect x={margin} y={12 + roofH} width={bw} height={faceH} fill="#fbf6ee" />
      <rect x={margin - 4} y={12 + roofH - 6} width={bw + 8} height={22} fill={accent} />
      {Array.from({ length: stripes }, (_, index) => (
        <rect
          key={index}
          x={margin - 2 + index * stripeW}
          y={12 + roofH - 6}
          width={Math.max(1, stripeW - 1.5)}
          height={22}
          fill={index % 2 === 0 ? accent : '#f6f1e8'}
        />
      ))}
      <text
        x={w / 2}
        y={12 + roofH + faceH * 0.62}
        textAnchor="middle"
        fontSize={signSize}
        fill="#243140"
        fontFamily="Outfit, sans-serif"
        fontWeight={600}
      >
        {short}
      </text>
      <Windows id={id} x={margin + 8} y={20 + roofH} w={bw * 0.62} h={faceH - 16} cols={2} rows={1} detail={detail} />
      <rect x={margin + bw * 0.74} y={18 + roofH} width={bw * 0.16} height={faceH - 10} fill="#6b4a32" />
      <rect x={12} y={12 + roofH + faceH + 8} width={w - 24} height={h - (12 + roofH + faceH + 18)} fill="#5d6672" />
      {Array.from({ length: 4 }, (_, index) => (
        <line
          key={index}
          x1={16 + ((w - 32) / 4) * index}
          y1={18 + roofH + faceH}
          x2={16 + ((w - 32) / 4) * index}
          y2={h - 14}
          stroke="#efeae1"
          strokeWidth={1.2}
          opacity={0.7}
        />
      ))}
    </g>
  );
}

function DinerArt({ def }: { def: BuildingDef }) {
  const { w, h } = def;
  return (
    <g>
      <rect width={w} height={h} fill={siteFill(def.districtId)} />
      <rect x={20} y={h - 48} width={w - 40} height={28} fill="#5d6672" />
      <rect x={22} y={28} width={w - 44} height={h * 0.48} rx={18} fill="#c4493a" />
      <rect x={22} y={28 + h * 0.2} width={w - 44} height={16} fill="#f4f1ea" />
      {Array.from({ length: 10 }, (_, index) => (
        <rect key={index} x={28 + index * ((w - 56) / 10)} y={32 + h * 0.2} width={(w - 56) / 20} height={8} fill={index % 2 ? '#1c2430' : '#f4f1ea'} />
      ))}
      <rect x={36} y={52 + h * 0.2} width={w * 0.28} height={h * 0.16} rx={2} fill="#9fd0dc" />
      <rect x={w * 0.42} y={52 + h * 0.2} width={w * 0.28} height={h * 0.16} rx={2} fill="#9fd0dc" />
      <rect x={w * 0.74} y={58 + h * 0.18} width={18} height={h * 0.16} fill="#6b4a32" />
      <rect x={w - 58} y={8} width={8} height={36} fill="#5c6570" />
      <rect x={w - 86} y={8} width={46} height={16} rx={2} fill="#f2efe8" stroke="#c4493a" />
      <text x={w - 63} y={20} textAnchor="middle" fontSize={9} fill="#a33b32" fontFamily="Outfit, sans-serif">
        DINER
      </text>
    </g>
  );
}

function FactoryArt({ def }: { def: BuildingDef }) {
  const { w, h, accent } = def;
  const teeth = w > 320 ? 5 : 4;
  const roofW = w - 28;
  const roofH = h * 0.42;
  let saw = `M14,${18 + roofH}`;
  const tooth = roofW / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const x = 14 + i * tooth;
    saw += ` L${x + tooth * 0.2},${22} L${x + tooth},${18 + roofH}`;
  }
  saw += ' Z';
  return (
    <g>
      <rect width={w} height={h} fill="#ddd9d1" />
      <ellipse cx={w / 2} cy={h - 8} rx={w * 0.36} ry={7} fill="#1a2430" opacity={0.12} />
      <path d={saw} fill="#6f767f" />
      <path d={saw} fill="none" stroke="#6d737c" strokeWidth={2} />
      <rect x={w * 0.72} y={8} width={16} height={h * 0.36} fill="#5c636c" />
      <rect x={w * 0.7} y={6} width={22} height={6} fill="#3e444c" />
      <circle cx={w * 0.74} cy={4} r={7} fill="#c5ccd1" opacity={0.7} />
      <rect x={16} y={18 + roofH} width={w - 32} height={h * 0.22} fill="#6a7078" />
      {Array.from({ length: teeth }, (_, index) => (
        <rect key={index} x={24 + index * ((w - 48) / teeth)} y={24 + roofH} width={(w - 48) / teeth - 8} height={h * 0.14} fill="#22323c" />
      ))}
      <rect x={16} y={h * 0.72} width={w - 32} height={h * 0.18} fill="#cfc8ba" />
      {Array.from({ length: 6 }, (_, index) => (
        <rect key={index} x={20 + index * ((w - 40) / 6)} y={h * 0.74} width={(w - 40) / 12} height={h * 0.14} fill={index % 2 ? '#e2b43a' : '#2c333c'} />
      ))}
      <rect x={18} y={h - 28} width={36} height={16} rx={2} fill={accent} />
    </g>
  );
}

function WarehouseArt({ def }: { def: BuildingDef }) {
  const { w, h, accent } = def;
  const doors = Math.max(2, Math.round(w / 90));
  return (
    <g>
      <rect width={w} height={h} fill={siteFill(def.districtId)} />
      <rect x={12} y={12} width={w - 24} height={h * 0.58} fill="#b7b1a6" />
      {Array.from({ length: 7 }, (_, index) => (
        <line key={index} x1={12} y1={20 + index * ((h * 0.5) / 7)} x2={w - 12} y2={20 + index * ((h * 0.5) / 7)} stroke="#8f897e" strokeWidth={2} opacity={0.7} />
      ))}
      <rect x={12} y={12 + h * 0.58} width={w - 24} height={h * 0.16} fill="#5f6670" />
      {Array.from({ length: doors }, (_, index) => (
        <rect
          key={index}
          x={20 + index * ((w - 36) / doors)}
          y={16 + h * 0.58}
          width={(w - 36) / doors - 6}
          height={h * 0.12}
          fill="#2c333c"
        />
      ))}
      {h > 170 && (
        <g transform={`translate(${w * 0.62} ${h - 28})`}>
          <rect x={0} y={0} width={54} height={16} rx={2} fill="#d5dbe0" />
          <rect x={40} y={2} width={18} height={12} rx={2} fill={accent} />
          <rect x={44} y={4} width={8} height={5} fill="#9fd0dc" />
        </g>
      )}
    </g>
  );
}

function PierArt({ def }: { def: BuildingDef }) {
  const { w, h, accent, short } = def;
  return (
    <g>
      <rect width={w} height={h} fill="#e5dfd3" />
      <rect x={10} y={10} width={w - 20} height={h * 0.62} fill="#8d97a1" />
      {Array.from({ length: 5 }, (_, index) => (
        <line key={index} x1={10} y1={18 + index * 10} x2={w - 10} y2={18 + index * 10} stroke="#6e7782" strokeWidth={2} />
      ))}
      <rect x={10} y={10} width={8} height={h * 0.62} fill={accent} />
      <rect x={14} y={h * 0.68} width={w - 28} height={h * 0.18} fill="#3e4654" />
      {Array.from({ length: 3 }, (_, index) => (
        <rect key={index} x={22 + index * ((w - 36) / 3)} y={h * 0.7} width={(w - 36) / 3 - 8} height={h * 0.12} fill="#f0d78c" opacity={0.85} />
      ))}
      <text x={w / 2} y={28} textAnchor="middle" fontSize={11} fill="#f7f4ee" fontFamily="Outfit, sans-serif" letterSpacing={1}>
        {short.toUpperCase()}
      </text>
    </g>
  );
}

function ContainerArt({ def }: { def: BuildingDef }) {
  const colors = ['#c4553a', '#2c6e8a', '#d1a24a', '#3e6b4f', '#8d4d3a', '#4e6278', '#c47b4a', '#355f73'];
  const colW = 46;
  const rowH = 28;
  const cols = Math.max(2, Math.floor((def.w - 16) / (colW + 8)));
  const rows = Math.max(2, Math.floor((def.h - 16) / (rowH + 10)));
  const boxes = [];
  let n = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = 12 + col * (colW + 8);
      const y = 14 + row * (rowH + 10);
      const color = colors[(n + hash(def.id, n)) % colors.length] ?? colors[0]!;
      boxes.push(
        <g key={n}>
          <rect x={x} y={y + 5} width={colW} height={rowH - 4} fill={color} opacity={0.85} />
          <rect x={x + 3} y={y} width={colW - 4} height={rowH - 6} fill={color} stroke="#1c2430" strokeOpacity={0.25} />
          <line x1={x + 8} y1={y} x2={x + 8} y2={y + rowH - 6} stroke="#1c2430" strokeOpacity={0.18} />
          <line x1={x + colW - 12} y1={y} x2={x + colW - 12} y2={y + rowH - 6} stroke="#1c2430" strokeOpacity={0.18} />
        </g>,
      );
      n += 1;
    }
  }
  return (
    <g>
      <rect width={def.w} height={def.h} fill="#c9c2b4" />
      <rect x={6} y={def.h / 2 - 6} width={def.w - 12} height={12} fill="#b7c0a8" opacity={0.7} />
      {boxes}
    </g>
  );
}

function CraneArt({ def }: { def: BuildingDef }) {
  const { w, h } = def;
  const base = h * 0.72;
  const mast = w * 0.28;
  return (
    <g>
      <rect width={w} height={h} fill="#cfc6b6" />
      <rect x={6} y={base - 34} width={w * 0.42} height={34} fill="#5e6772" />
      <rect x={6} y={base - 44} width={w * 0.42} height={10} fill="#9aa3ac" />
      <rect x={mast} y={8} width={12} height={base} fill="#e0b15a" />
      <rect x={mast - 16} y={base - 6} width={44} height={10} fill="#a6843f" />
      <polygon points={`${mast},14 ${w - 8},28 ${w - 8},40 ${mast + 12},28`} fill="#f0d48a" />
      <polygon points={`${mast},22 ${mast - 36},30 ${mast - 36},40 ${mast + 12},32`} fill="#c9963e" />
      <rect x={mast - 34} y={18} width={24} height={12} fill="#2c333c" />
      <line x1={w - 16} y1={34} x2={w - 16} y2={base - 8} stroke="#1c2430" strokeWidth={2} />
      <rect x={w - 28} y={base - 12} width={24} height={14} fill="#c4553a" />
      <rect x={4} y={h - 10} width={w - 8} height={6} fill="#b7ae9e" />
    </g>
  );
}

function MarinaArt({ def, detail }: { def: BuildingDef; detail: boolean }) {
  const { w, h, accent } = def;
  return (
    <g>
      <rect width={w} height={h} fill="#e7f2e4" />
      <rect x={16} y={16} width={w - 32} height={h * 0.48} fill="#f7f4ee" />
      <rect x={16} y={16} width={w - 32} height={h * 0.16} fill={accent} />
      <Windows id={def.id} x={24} y={20 + h * 0.16} w={w - 48} h={h * 0.26} cols={4} rows={1} detail={detail} />
      <rect x={18} y={h * 0.68} width={w - 36} height={h * 0.2} fill="#8d6a43" />
      {Array.from({ length: 4 }, (_, index) => (
        <circle key={index} cx={36 + index * ((w - 70) / 3)} cy={h * 0.78} r={5} fill="#f4efe6" />
      ))}
      <rect x={w - 36} y={8} width={3} height={24} fill="#5c6570" />
      <polygon points={`${w - 36},10 ${w - 18},14 ${w - 36},18`} fill="#f4efe6" />
    </g>
  );
}

function RestaurantArt({ def }: { def: BuildingDef }) {
  const { w, h, accent, short } = def;
  const size = Math.max(8, Math.min(12, (w - 40) / Math.max(short.length * 0.56, 1)));
  return (
    <g>
      <rect width={w} height={h} fill="#eaf3e1" />
      <rect x={14} y={14} width={w - 28} height={h * 0.42} fill="#f6f1e8" />
      <rect x={14} y={14} width={w - 28} height={12} fill={accent} />
      <text x={w / 2} y={h * 0.36} textAnchor="middle" fontSize={size} fill="#243140" fontFamily="Outfit, sans-serif" fontWeight={600}>
        {short}
      </text>
      <rect x={w * 0.72} y={30} width={14} height={h * 0.2} fill="#6b4a32" />
      <rect x={16} y={h * 0.62} width={w - 32} height={h * 0.26} fill="#c4a37a" />
      {Array.from({ length: 3 }, (_, index) => (
        <g key={index}>
          <circle cx={36 + index * ((w - 60) / 2)} cy={h * 0.74} r={7} fill="#f7f4ee" />
          <circle cx={36 + index * ((w - 60) / 2)} cy={h * 0.74} r={2} fill={accent} />
        </g>
      ))}
    </g>
  );
}

function BoatRentalArt({ def }: { def: BuildingDef }) {
  const { w, h, accent } = def;
  const colors = ['#c4553a', '#2f8f9a', '#d1a24a', '#3e6b4f'];
  return (
    <g>
      <rect width={w} height={h} fill="#e7f1e2" />
      <rect x={12} y={12} width={w * 0.46} height={h * 0.55} fill="#f7f4ee" />
      <rect x={12} y={12} width={w * 0.46} height={10} fill={accent} />
      <rect x={w * 0.58} y={18} width={w * 0.32} height={h * 0.62} fill="#d7c4a4" />
      {colors.map((color, index) => (
        <rect key={color} x={w * 0.62} y={24 + index * 16} width={w * 0.24} height={8} rx={4} fill={color} />
      ))}
      <text x={12 + w * 0.23} y={h * 0.42} textAnchor="middle" fontSize={10} fill="#243140" fontFamily="Outfit, sans-serif">
        KEEL
      </text>
    </g>
  );
}

function ResortArt({ def }: { def: BuildingDef }) {
  const { w, h } = def;
  return (
    <g>
      <rect width={w} height={h} fill="#e7f0df" />
      <rect x={12} y={h * 0.62} width={w * 0.42} height={h * 0.22} rx={8} fill="#7ebfd0" />
      <rect x={18} y={h * 0.66} width={w * 0.28} height={6} fill="#e7f6f8" opacity={0.7} />
      <rect x={14} y={16} width={w * 0.62} height={h * 0.42} fill="#f7f3ea" />
      <rect x={14} y={16} width={w * 0.62} height={12} fill="#1e3a5f" />
      {Array.from({ length: 4 }, (_, index) => (
        <line key={index} x1={14} y1={36 + index * 14} x2={14 + w * 0.62} y2={36 + index * 14} stroke="#d9d0c2" strokeWidth={2} />
      ))}
      <rect x={w * 0.7} y={h * 0.18} width={28} height={h * 0.62} fill="#f4efe6" />
      {Array.from({ length: 5 }, (_, index) => (
        <rect key={index} x={w * 0.7} y={h * 0.28 + index * 22} width={28} height={8} fill="#a33b32" />
      ))}
      <polygon points={`${w * 0.7 - 4},${h * 0.18} ${w * 0.7 + 14},${h * 0.08} ${w * 0.7 + 32},${h * 0.18}`} fill="#1e3a5f" />
      <rect x={w * 0.7 + 8} y={h * 0.1} width={12} height={10} fill="#f3d48a" />
    </g>
  );
}

function LevelMark({ w, level }: { w: number; level: number }) {
  if (level < 2) return null;
  const x = Math.max(8, w / 2 - 11);
  return (
    <g aria-hidden="true">
      <rect x={x} y={5} width={22} height={4} fill="#c6a15a" />
      {level >= 3 && (
        <g>
          <rect x={x + 5} y={-7} width={12} height={12} fill="#243140" />
          <rect x={x + 9} y={-13} width={2} height={7} fill="#5c6570" />
        </g>
      )}
    </g>
  );
}

function renderArt(def: BuildingDef, detail: boolean) {
  switch (def.art) {
    case 'loft':
      return <LoftArt def={def} detail={detail} />;
    case 'office':
      return <OfficeArt def={def} heli={def.id === 'harborview-tower'} detail={detail} />;
    case 'hq':
      return <HeadquartersArt def={def} detail={detail} />;
    case 'shop':
      return <ShopArt def={def} detail={detail} />;
    case 'diner':
      return <DinerArt def={def} />;
    case 'factory':
      return <FactoryArt def={def} />;
    case 'warehouse':
      return <WarehouseArt def={def} />;
    case 'pier':
      return <PierArt def={def} />;
    case 'containers':
      return <ContainerArt def={def} />;
    case 'crane':
      return <CraneArt def={def} />;
    case 'marina':
      return <MarinaArt def={def} detail={detail} />;
    case 'restaurant':
      return <RestaurantArt def={def} />;
    case 'boats':
      return <BoatRentalArt def={def} />;
    case 'resort':
      return <ResortArt def={def} />;
  }
}

const STATUS_COLOR: Record<Ownership, string> = {
  available: '#e0b15a',
  owned: '#2f9d6c',
  rival: '#8d5a3c',
  locked: '#8b919a',
};

function StatusMark({ status, w }: { status: Ownership; w: number }) {
  const size = 26;
  const x = w - size - 7;
  const y = 7;
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={size} height={size} fill={STATUS_COLOR[status]} />
      {status === 'available' && <rect x={x + 5} y={y + 11} width={16} height={4} fill="#1c2430" />}
      {status === 'owned' && <rect x={x + 6} y={y + 6} width={14} height={14} fill="#e7f6ee" />}
      {status === 'rival' && <polygon points={`${x + 13},${y + 5} ${x + 21},${y + 13} ${x + 13},${y + 21} ${x + 5},${y + 13}`} fill="#f6efe6" />}
      {status === 'locked' && (
        <g>
          <rect x={x + 7} y={y + 12} width={12} height={8} fill="#f4efe6" />
          <path d={`M${x + 9},${y + 12} V${y + 8} H${x + 17} V${y + 12}`} fill="none" stroke="#f4efe6" strokeWidth={1.6} />
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
      <ellipse cx={def.w / 2} cy={def.h - 3} rx={def.w * 0.4} ry={5} fill="#1a2430" opacity={0.1} />
      {renderArt(def, detail)}
      <LevelMark w={def.w} level={status === 'owned' ? level : 1} />
      <StatusMark status={status} w={def.w} />
      {status === 'owned' && detail && (
        <rect x={8} y={def.h - 10} width={10} height={4} fill="#f3d7a2" opacity={0.9} />
      )}
      <rect className="lot-outline" x={0.5} y={0.5} width={def.w - 1} height={def.h - 1} fill="transparent" />
    </g>
  );
}
