import { useEffect, useState } from 'react';
import { PARKING, WORLD, type ParkingLot } from '../data/layout';

function Tree({ x, y, r, variant }: { x: number; y: number; r: number; variant: number }) {
  const canopy = ['#3f6b38', '#4e7c42', '#356332', '#5a8748'];
  const leaf = ['#6fa85a', '#7eb868', '#5e984c', '#8cbc70'];
  const shade = canopy[variant % canopy.length] ?? '#3f6b38';
  const crown = leaf[variant % leaf.length] ?? '#6fa85a';
  return (
    <g>
      <ellipse cx={x + r * 0.22} cy={y + r * 0.42} rx={r * 0.95} ry={r * 0.42} fill="#102028" opacity={0.22} />
      <circle cx={x + r * 0.08} cy={y + r * 0.06} r={r} fill={shade} />
      <circle cx={x - r * 0.12} cy={y - r * 0.1} r={r * 0.74} fill={crown} />
      <circle cx={x - r * 0.28} cy={y - r * 0.28} r={r * 0.36} fill="#e4f0cc" opacity={0.7} />
      <circle cx={x + r * 0.05} cy={y + r * 0.02} r={Math.max(1.6, r * 0.12)} fill="#6a4630" />
    </g>
  );
}

function Palm({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x},${y + 20} Q${x + 6},${y + 4} ${x},${y - 10}`} stroke="#8a623e" strokeWidth={3} fill="none" />
      {[0, 55, 110, 170, 230, 290].map((angle) => (
        <ellipse key={angle} cx={x} cy={y - 10} rx={14} ry={4} fill="#5f8a48" transform={`rotate(${angle} ${x} ${y - 10})`} />
      ))}
    </g>
  );
}

function Car({ x, y, rot, color }: { x: number; y: number; rot: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-7} y={-12} width={14} height={24} rx={3} fill={color} />
      <rect x={-5} y={-6} width={10} height={7} rx={1} fill="#d7e7ee" opacity={0.8} />
    </g>
  );
}

function Truck({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-13} y={-36} width={26} height={28} rx={2} fill="#d5dbe0" />
      <rect x={-13} y={-6} width={26} height={6} fill="#2c333c" />
      <rect x={-12} y={2} width={24} height={16} rx={2} fill="#b23b3b" />
      <rect x={-8} y={5} width={16} height={6} fill="#9fd0dc" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={2} height={16} fill="#2c333c" />
      <circle cx={x + 1} cy={y} r={3.2} fill="#f6e7b8" />
    </g>
  );
}

function ParkingLotGraphic({ lot }: { lot: ParkingLot }) {
  const bayW = lot.w / lot.cols;
  const bayH = lot.h / lot.rows;
  const lines = [];
  for (let col = 1; col < lot.cols; col += 1) {
    lines.push(
      <line
        key={`c${col}`}
        x1={lot.x + col * bayW}
        y1={lot.y + 5}
        x2={lot.x + col * bayW}
        y2={lot.y + lot.h - 5}
        stroke="#efeae0"
        strokeWidth={1.2}
        opacity={0.75}
      />,
    );
  }
  for (let row = 1; row < lot.rows; row += 1) {
    lines.push(
      <line
        key={`r${row}`}
        x1={lot.x + 4}
        y1={lot.y + row * bayH}
        x2={lot.x + lot.w - 4}
        y2={lot.y + row * bayH}
        stroke="#c9c3b6"
        strokeWidth={2}
      />,
    );
  }
  const colors = ['#e6eaee', '#c4493a', '#2f4c5c', '#d1a24a', '#3e6b4f', '#8d97a1'];
  const cars = [];
  let n = 0;
  for (let row = 0; row < lot.rows; row += 1) {
    for (let col = 0; col < lot.cols; col += 1) {
      n += 1;
      if (n % 3 === 0) continue;
      cars.push(
        <Car
          key={`${lot.id}-${n}`}
          x={lot.x + col * bayW + bayW / 2}
          y={lot.y + row * bayH + bayH / 2}
          rot={bayW > bayH ? 90 : 0}
          color={colors[n % colors.length] ?? '#e6eaee'}
        />,
      );
    }
  }
  return (
    <g>
      <rect x={lot.x} y={lot.y} width={lot.w} height={lot.h} fill="#5a6270" />
      {lines}
      {cars}
    </g>
  );
}

function cluster(x0: number, y0: number, cols: number, rows: number, gap: number, salt: number) {
  const trees = [];
  let n = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      n += 1;
      if ((n + salt) % 4 === 0) continue;
      trees.push({
        x: x0 + col * gap + ((n * 13) % 9),
        y: y0 + row * gap + ((n * 7) % 8),
        r: 11 + ((n + salt) % 4),
        variant: (n + salt) % 4,
      });
    }
  }
  return trees;
}

function streetRow(y: number, x1: number, x2: number, step: number, r: number, salt: number) {
  const roads = [48, 920, 1760, 2500, 3180];
  const trees = [];
  let index = 0;
  for (let x = x1; x <= x2; x += step) {
    index += 1;
    if (roads.some((road) => x > road - 28 && x < road + 78)) continue;
    trees.push({
      x,
      y: y + ((index * 7 + salt) % 7) - 3,
      r: r + (index % 3),
      variant: (index + salt) % 4,
    });
  }
  return trees;
}

const TREES = [
  ...streetRow(624, 150, 2420, 78, 12, 1),
  ...streetRow(732, 170, 1680, 86, 11, 2),
  ...streetRow(732, 1900, 2420, 90, 11, 3),
  ...cluster(2060, 900, 3, 2, 78, 4),
  ...cluster(2620, 1080, 8, 3, 72, 2),
  ...cluster(3050, 1180, 5, 2, 70, 5),
  ...cluster(3000, 1640, 3, 2, 70, 1),
  ...cluster(2640, 180, 4, 4, 78, 6),
  ...cluster(3340, 160, 3, 5, 72, 3),
  ...cluster(160, 560, 4, 1, 70, 6),
];

const BLUFF_ALLEE = [160, 250, 340, 430, 520].flatMap((y) => [
  { x: 2920, y, r: 16, variant: 0 },
  { x: 3088, y, r: 15, variant: 2 },
]);

export function Scenery() {
  return (
    <g className="scenery">
      <rect width={WORLD.width} height={WORLD.height} fill="url(#oceanGrad)" />
      <rect width={WORLD.width} height={WORLD.height} fill="url(#swell)" />
      <rect width={WORLD.width} height={WORLD.height} fill="url(#chop)" opacity={0.85} />
      <path
        d="M0,0 H3600 V1980 H2680 C2580,1960 2520,1900 2480,1860 H0 Z"
        fill="#d7cbb6"
      />
      <path
        d="M0,1860 H2480 C2580,1900 2700,1972 3000,1984 H3600"
        fill="none"
        stroke="#f7f4ee"
        strokeWidth={5}
        opacity={0.55}
      />
      <path className="water-shimmer" d="M120,1930 C420,1908 760,1955 1100,1928 C1500,1898 1680,1948 1900,1932" fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={2} />
      <path className="water-shimmer" d="M80,2060 C400,2036 820,2088 1200,2052 C1600,2020 2000,2076 2360,2048" fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={2} />
      <path className="water-shimmer" d="M2500,2088 C2800,2064 3100,2110 3400,2080" fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={2} />

      <rect x={116} y={102} width={2360} height={520} fill="#e6d8c2" />
      <rect x={116} y={736} width={1628} height={468} fill="#f1e3cc" />
      <rect x={1848} y={748} width={636} height={456} fill="#dce8d4" />
      <rect x={116} y={1300} width={1628} height={444} fill="#d4d1c9" />
      <rect x={1840} y={1300} width={644} height={448} fill="#d2cdc3" />
      <rect x={2572} y={102} width={960} height={522} fill="#d5e4ca" />
      <rect x={2572} y={736} width={960} height={468} fill="#d8e7cd" />
      <rect x={2572} y={1300} width={960} height={540} fill="#d2e3c8" />

      <path d="M2520,1848 C2640,1908 2780,1976 3120,1988 H3600 V1888 H2556 C2540,1872 2528,1860 2520,1848 Z" fill="url(#sandGrad)" />

      <g>
        <rect x={1860} y={1046} width={580} height={16} fill="#e7dcc8" />
        <rect x={2266} y={770} width={16} height={400} fill="#e7dcc8" />
        <circle cx={2300} cy={1054} r={36} fill="#d5ddd4" />
        <circle cx={2300} cy={1054} r={26} fill="#7eb8c9" />
        <circle cx={2300} cy={1054} r={8} fill="#eef7f8" />
        <rect x={1980} y={1096} width={28} height={8} rx={1} fill="#6b4e32" />
        <rect x={2360} y={980} width={28} height={8} rx={1} fill="#6b4e32" />
      </g>

      <g>
        <ellipse cx={2740} cy={250} rx={78} ry={42} fill="#6eafc0" />
        <ellipse cx={2740} cy={250} rx={48} ry={24} fill="#d5eef3" opacity={0.35} />
        <circle cx={3000} cy={340} r={58} fill="#c9dcb8" />
        <circle cx={3000} cy={340} r={30} fill="#e7f0df" />
        <circle cx={3000} cy={340} r={30} fill="none" stroke="#8aa37a" />
        <rect x={2992} y={398} width={16} height={242} fill="#e6dcc8" />
        <rect x={2760} y={332} width={232} height={14} fill="#e6dcc8" />
        <polygon points="3348,214 3404,180 3460,214" fill="#c4553a" />
        <rect x={3360} y={214} width={88} height={40} fill="#f7f4ee" />
        <rect x={3384} y={222} width={16} height={22} fill="#7eb8c9" />
        <rect x={3416} y={222} width={14} height={32} fill="#6b4a32" />
      </g>

      <rect x={2588} y={1836} width={900} height={18} fill="#eadcbe" />
      <rect x={2588} y={1842} width={900} height={2} fill="#d3c4a4" />
      {Array.from({ length: 18 }, (_, index) => (
        <rect key={index} x={2604 + index * 48} y={1832} width={3} height={22} fill="#8d939c" />
      ))}

      <g>
        <polygon points="1920,1744 2400,1744 2360,1900 1960,1900" fill="#cfc6b6" />
        <rect x={1848} y={1848} width={640} height={250} fill="#cfc6b6" />
        <rect x={1848} y={1848} width={640} height={8} fill="#b7ae9e" />
        {Array.from({ length: 8 }, (_, index) => (
          <g key={index}>
            <rect x={1880 + index * 74} y={2068} width={10} height={28} fill="#8a7b66" />
            <circle cx={1885 + index * 74} cy={2076} r={4} fill="#5c6570" />
          </g>
        ))}
        <rect x={1760} y={1920} width={90} height={22} fill="#8d6a43" />
        <rect x={1848} y={1968} width={28} height={90} fill="#8d6a43" />
      </g>

      {[2688, 2860, 3032].map((x) => (
        <g key={x}>
          <rect x={x} y={1988} width={18} height={150} fill="#8d6a43" />
          {Array.from({ length: 8 }, (_, index) => (
            <line key={index} x1={x} y1={2000 + index * 16} x2={x + 18} y2={2000 + index * 16} stroke="#6d5132" strokeOpacity={0.45} />
          ))}
        </g>
      ))}
      <g transform="translate(560 1960)">
        <ellipse cx={250} cy={48} rx={250} ry={18} fill="#083044" opacity={0.28} />
        <path d="M20,40 C80,16 400,16 470,40 C484,48 484,62 470,68 C400,90 80,90 20,68 C6,62 6,48 20,40 Z" fill="#b4332c" />
        <path d="M40,40 C100,28 390,28 450,40 L450,52 C390,40 100,40 40,52 Z" fill="#8d241e" />
        <rect x={70} y={18} width={36} height={20} fill="#d24b3a" />
        <rect x={110} y={18} width={36} height={20} fill="#1f6f9a" />
        <rect x={150} y={18} width={36} height={20} fill="#e07a32" />
        <rect x={190} y={18} width={36} height={20} fill="#3e7a4a" />
        <rect x={230} y={14} width={36} height={24} fill="#f4efe6" />
        <rect x={270} y={18} width={36} height={20} fill="#2f8f9a" />
        <rect x={330} y={6} width={78} height={36} rx={2} fill="#f7f4ee" />
        <rect x={338} y={12} width={28} height={10} fill="#7eb8c9" />
        <rect x={372} y={12} width={24} height={10} fill="#7eb8c9" />
        <rect x={392} y={-8} width={6} height={18} fill="#5c6570" />
      </g>
      {[
        [2100, 2140],
        [2280, 2160],
        [2460, 2136],
        [900, 2088],
        [600, 2148],
      ].map(([x, y]) => (
        <g key={`rock-${x}`}>
          <ellipse cx={x} cy={y} rx={28} ry={12} fill="#c4b49a" />
          <ellipse cx={(x ?? 0) + 18} cy={(y ?? 0) + 6} rx={16} ry={8} fill="#8d8272" />
        </g>
      ))}
      {[
        [2740, 2060, 20],
        [2790, 2096, -12],
        [2910, 2054, 8],
        [2964, 2102, 24],
        [3088, 2068, -8],
      ].map(([x, y, rot], index) => (
        <g key={index} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <rect x={-18} y={-5} width={36} height={10} rx={5} fill={index % 2 ? '#f7f4ee' : '#d9e7ee'} />
          <rect x={-2} y={-3.5} width={12} height={7} rx={1} fill="#7eb8c9" />
        </g>
      ))}

      {[
        [3320, 1924, '#c4553a'],
        [3400, 1936, '#2f8f9a'],
        [3488, 1918, '#d1a24a'],
      ].map(([x, y, color]) => (
        <g key={String(x)}>
          <circle cx={Number(x)} cy={Number(y)} r={11} fill={String(color)} />
          <circle cx={Number(x)} cy={Number(y)} r={2} fill="#f7f4ee" />
        </g>
      ))}
      {[2680, 2860, 3040, 3240, 3400, 3560].map((x, index) => (
        <Palm key={`palm-${x}`} x={x} y={1888 + (index % 2) * 18} />
      ))}

      {TREES.map((tree, index) => (
        <Tree key={index} x={tree.x} y={tree.y} r={tree.r} variant={tree.variant} />
      ))}
      {BLUFF_ALLEE.map((tree, index) => (
        <Tree key={`bluff-${index}`} x={tree.x} y={tree.y} r={tree.r} variant={tree.variant} />
      ))}
      {PARKING.map((lot) => (
        <ParkingLotGraphic key={lot.id} lot={lot} />
      ))}

      <g>
        <rect x={1448} y={1336} width={270} height={360} fill="#cfc8ba" />
        <rect x={1464} y={1510} width={230} height={18} fill="#e2b43a" />
        <rect x={1472} y={1360} width={22} height={16} fill="#8a6a45" />
        <rect x={1500} y={1360} width={22} height={16} fill="#6e7580" />
        <rect x={1528} y={1360} width={22} height={16} fill="#8a6a45" />
        <Truck x={1560} y={1450} rot={0} />
        <Truck x={1648} y={1600} rot={12} />
      </g>

      {Array.from({ length: 10 }, (_, index) => (
        <Lamp key={`b${index}`} x={180 + index * 210} y={624} />
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <Lamp key={`c${index}`} x={2620 + index * 110} y={1830} />
      ))}
    </g>
  );
}

function useMotion(): boolean {
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setMotion(!query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return motion;
}

const LANES = [
  { id: 'broadway-east', from: 180, to: 2460, y: 654, color: '#f4f7f8', dur: '46s', rot: 90 },
  { id: 'broadway-west', from: 2400, to: 200, y: 702, color: '#d24b3a', dur: '52s', rot: -90 },
  { id: 'market-east', from: 220, to: 1680, y: 1246, color: '#1f6f9a', dur: '40s', rot: 90 },
  { id: 'market-west', from: 1500, to: 160, y: 1274, color: '#e0a03a', dur: '36s', rot: -90 },
  { id: 'harbor-east', from: 200, to: 2300, y: 1784, color: '#f7f4ee', dur: '48s', rot: 90 },
];

export function Traffic() {
  const motion = useMotion();
  return (
    <g className="traffic" pointerEvents="none">
      {LANES.map((lane) => (
        <g key={lane.id} transform={motion ? undefined : `translate(${(lane.from + lane.to) / 2} ${lane.y})`}>
          {motion && (
            <animateTransform
              attributeName="transform"
              type="translate"
              from={`${lane.from} ${lane.y}`}
              to={`${lane.to} ${lane.y}`}
              dur={lane.dur}
              repeatCount="indefinite"
            />
          )}
          <Car x={0} y={0} rot={lane.rot} color={lane.color} />
        </g>
      ))}
    </g>
  );
}

export function MapDefs() {
  return (
    <defs>
      <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#49c4e4" />
        <stop offset="42%" stopColor="#1a8fbe" />
        <stop offset="100%" stopColor="#0c6a96" />
      </linearGradient>
      <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f3e6c8" />
        <stop offset="100%" stopColor="#e4c98a" />
      </linearGradient>
      <pattern id="swell" width="140" height="42" patternUnits="userSpaceOnUse">
        <path d="M0 16 Q 35 6 70 16 T 140 16" fill="none" stroke="#e7f6fb" strokeWidth={1.7} opacity={0.55} />
        <path d="M0 30 Q 35 22 70 30 T 140 30" fill="none" stroke="#08344c" strokeWidth={1.3} opacity={0.22} />
      </pattern>
      <pattern id="chop" width="260" height="78" patternUnits="userSpaceOnUse">
        <path d="M0 46 C 50 30 90 62 140 46 S 230 30 260 46" fill="none" stroke="#ffffff" strokeWidth={2.2} opacity={0.22} />
        <path d="M0 18 C 40 8 80 28 130 16" fill="none" stroke="#b7e4f2" strokeWidth={1.2} opacity={0.35} />
      </pattern>
    </defs>
  );
}
