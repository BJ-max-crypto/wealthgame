import { H_ROADS, V_ROADS, type HRoad, type VRoad } from '../data/layout';

const SIDEWALK = 14;

function crosses(h: HRoad, v: VRoad): boolean {
  return h.x1 < v.x + v.w && h.x2 > v.x && v.y1 < h.y + h.w && v.y2 > h.y;
}

function subtract(spans: Array<[number, number]>, cutA: number, cutB: number): Array<[number, number]> {
  const next: Array<[number, number]> = [];
  for (const [a, b] of spans) {
    if (b <= cutA || a >= cutB) {
      next.push([a, b]);
      continue;
    }
    if (a < cutA) next.push([a, Math.min(b, cutA)]);
    if (b > cutB) next.push([Math.max(a, cutB), b]);
  }
  return next.filter(([a, b]) => b - a > 12);
}

function Crosswalk({ x, y, w, h, vertical }: { x: number; y: number; w: number; h: number; vertical: boolean }) {
  const bands = 5;
  const marks = [];
  for (let i = 0; i < bands; i += 1) {
    if (vertical) {
      const bandW = w / (bands * 2 - 1);
      marks.push(
        <rect key={i} x={x + i * bandW * 2} y={y} width={bandW} height={h} fill="#f4f0e6" opacity={0.92} />,
      );
    } else {
      const bandH = h / (bands * 2 - 1);
      marks.push(
        <rect key={i} x={x} y={y + i * bandH * 2} width={w} height={bandH} fill="#f4f0e6" opacity={0.92} />,
      );
    }
  }
  return <g>{marks}</g>;
}

export function Roads() {
  const horizontalMarks = H_ROADS.map((road) => {
    let spans: Array<[number, number]> = [[road.x1 + 10, road.x2 - 10]];
    for (const vertical of V_ROADS) {
      if (!crosses(road, vertical)) continue;
      spans = subtract(spans, vertical.x - 4, vertical.x + vertical.w + 4);
    }
    const y = road.y + road.w / 2;
    return spans.map(([x1, x2], index) => (
      <line
        key={`${road.id}-${index}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="#e2c56a"
        strokeWidth={2}
        strokeDasharray="16 14"
      />
    ));
  });

  const verticalMarks = V_ROADS.map((road) => {
    let spans: Array<[number, number]> = [[road.y1 + 10, road.y2 - 10]];
    for (const horizontal of H_ROADS) {
      if (!crosses(horizontal, road)) continue;
      spans = subtract(spans, horizontal.y - 4, horizontal.y + horizontal.w + 4);
    }
    const x = road.x + road.w / 2;
    return spans.map(([y1, y2], index) => (
      <line
        key={`${road.id}-${index}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke="#e2c56a"
        strokeWidth={2}
        strokeDasharray="16 14"
      />
    ));
  });

  const broadway = H_ROADS[1]!;
  let median: Array<[number, number]> = [[160, 2460]];
  for (const vertical of V_ROADS) {
    if (!crosses(broadway, vertical)) continue;
    median = subtract(median, vertical.x - 8, vertical.x + vertical.w + 8);
  }

  return (
    <g className="roads">
      {H_ROADS.map((road) => (
        <rect
          key={`${road.id}-walk`}
          x={road.x1}
          y={road.y - SIDEWALK}
          width={road.x2 - road.x1}
          height={road.w + SIDEWALK * 2}
          fill="#ddd4c4"
        />
      ))}
      {V_ROADS.map((road) => (
        <rect
          key={`${road.id}-walk`}
          x={road.x - SIDEWALK}
          y={road.y1}
          width={road.w + SIDEWALK * 2}
          height={road.y2 - road.y1}
          fill="#ddd4c4"
        />
      ))}
      {H_ROADS.map((road) => (
        <rect key={road.id} x={road.x1} y={road.y} width={road.x2 - road.x1} height={road.w} fill="#3e4654" />
      ))}
      {V_ROADS.map((road) => (
        <rect key={road.id} x={road.x} y={road.y1} width={road.w} height={road.y2 - road.y1} fill="#3e4654" />
      ))}
      {median.map(([x1, x2], index) => (
        <g key={`median-${index}`}>
          <rect x={x1} y={broadway.y + broadway.w / 2 - 8} width={x2 - x1} height={16} fill="#6d8f5c" />
          {Array.from({ length: Math.floor((x2 - x1) / 70) }, (_, tree) => {
            const x = x1 + 28 + tree * 70;
            if (x > x2 - 20) return null;
            return <circle key={tree} cx={x} cy={broadway.y + broadway.w / 2} r={5} fill="#5e844c" />;
          })}
        </g>
      ))}
      {horizontalMarks}
      {verticalMarks}
      {H_ROADS.flatMap((horizontal) =>
        V_ROADS.filter((vertical) => crosses(horizontal, vertical)).map((vertical) => {
          const gap = 8;
          return (
            <g key={`${horizontal.id}-${vertical.id}`}>
              <Crosswalk
                x={vertical.x + 8}
                y={horizontal.y - 16}
                w={vertical.w - 16}
                h={12}
                vertical
              />
              <Crosswalk
                x={vertical.x + 8}
                y={horizontal.y + horizontal.w + 4}
                w={vertical.w - 16}
                h={12}
                vertical
              />
              <Crosswalk
                x={vertical.x - 16}
                y={horizontal.y + gap}
                w={12}
                h={horizontal.w - gap * 2}
                vertical={false}
              />
              <Crosswalk
                x={vertical.x + vertical.w + 4}
                y={horizontal.y + gap}
                w={12}
                h={horizontal.w - gap * 2}
                vertical={false}
              />
            </g>
          );
        }),
      )}
    </g>
  );
}
