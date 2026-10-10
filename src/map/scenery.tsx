import { PARKING, WORLD, type ParkingLot } from '../data/layout';

function Tree({ x, y, r, variant }: { x: number; y: number; r: number; variant: number }) {
  const greens = ['#6d9458', '#7ea468', '#5e854c', '#688b52'];
  return (
    <g>
      <ellipse cx={x + 2} cy={y + r * 0.35} rx={r * 0.75} ry={r * 0.35} fill="#1a2430" opacity={0.12} />
      <rect x={x - 1.4} y={y} width={2.8} height={r * 0.45} fill="#6b4a32" />
      <circle cx={x} cy={y - r * 0.15} r={r} fill={greens[variant % greens.length]} />
      <circle cx={x - r * 0.28} cy={y - r * 0.35} r={r * 0.48} fill="#c5d7a4" opacity={0.35} />
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

const TREES = [
  ...cluster(2640, 150, 6, 4, 86, 1).filter((tree) => Math.hypot(tree.x - 3000, tree.y - 340) > 78),
  ...cluster(3300, 170, 2, 4, 90, 2),
  ...cluster(1888, 820, 2, 2, 70, 3),
  ...cluster(2200, 820, 2, 2, 78, 4),
  ...cluster(1880, 1088, 4, 1, 80, 5),
  ...cluster(2620, 1080, 5, 2, 84, 2),
  ...cluster(140, 600, 3, 1, 70, 6),
];

export function Scenery() {
  return (
    <g className="scenery">
      <rect width={WORLD.width} height={WORLD.height} fill="url(#oceanGrad)" />
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
      <path d="M120,1930 C420,1908 760,1955 1100,1928 C1500,1898 1680,1948 1900,1932" fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={2} />
      <path d="M80,2060 C400,2036 820,2088 1200,2052 C1600,2020 2000,2076 2360,2048" fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={2} />
      <path d="M2500,2088 C2800,2064 3100,2110 3400,2080" fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={2} />

      <rect x={116} y={102} width={2360} height={520} fill="#e3d7c2" />
      <rect x={116} y={736} width={1628} height={468} fill="#efe2ce" />
      <rect x={1848} y={748} width={636} height={456} fill="#dce8d2" />
      <rect x={116} y={1300} width={1628} height={444} fill="#d5d2cb" />
      <rect x={1840} y={1300} width={644} height={448} fill="#d4cec2" />
      <rect x={2572} y={102} width={960} height={522} fill="#d5e3c8" />
      <rect x={2572} y={736} width={960} height={468} fill="#d7e6cb" />
      <rect x={2572} y={1300} width={960} height={540} fill="#d3e2c6" />

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
        <circle cx={3000} cy={340} r={58} fill="#c9dcb8" />
        <circle cx={3000} cy={340} r={30} fill="#e7f0df" />
        <circle cx={3000} cy={340} r={30} fill="none" stroke="#8aa37a" />
        <rect x={2992} y={398} width={16} height={242} fill="#e6dcc8" />
        <rect x={2700} y={332} width={220} height={12} fill="#e6dcc8" />
      </g>

      <rect x={2588} y={1836} width={900} height={18} fill="#eadcbe" />
      <rect x={2588} y={1842} width={900} height={2} fill="#d3c4a4" />
      {Array.from({ length: 18 }, (_, index) => (
        <rect key={index} x={2604 + index * 48} y={1832} width={3} height={22} fill="#8d939c" />
      ))}

      <g>
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
      <g transform="translate(1180 1968)">
        <ellipse cx={170} cy={36} rx={168} ry={16} fill="#0c3a4d" opacity={0.22} />
        <path d="M24,28 C90,10 250,10 318,28 C330,32 330,42 318,46 C250,64 90,64 24,46 C12,42 12,32 24,28 Z" fill="#3e4c59" />
        <rect x={78} y={24} width={34} height={18} fill="#c4553a" />
        <rect x={116} y={24} width={34} height={18} fill="#2c6e8a" />
        <rect x={154} y={24} width={34} height={18} fill="#d1a24a" />
        <rect x={192} y={24} width={28} height={18} fill="#3e6b4f" />
        <rect x={236} y={16} width={46} height={28} rx={2} fill="#e7e1d6" />
        <rect x={244} y={20} width={30} height={8} fill="#8ec9d4" />
      </g>
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
      <Palm x={3240} y={1920} />
      <Palm x={3560} y={1936} />
      <Palm x={3480} y={1904} />

      {TREES.map((tree, index) => (
        <Tree key={index} x={tree.x} y={tree.y} r={tree.r} variant={tree.variant} />
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

export function MapDefs() {
  return (
    <defs>
      <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8fd0db" />
        <stop offset="28%" stopColor="#2f8eab" />
        <stop offset="100%" stopColor="#0d3e56" />
      </linearGradient>
      <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f3e6c8" />
        <stop offset="100%" stopColor="#e4c98a" />
      </linearGradient>
    </defs>
  );
}
