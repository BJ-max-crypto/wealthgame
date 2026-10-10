import { DISTRICTS, WORLD } from '../data/layout';
import type { Camera } from '../game/camera';

export function Minimap({
  cam,
  viewW,
  viewH,
  onFocus,
}: {
  cam: Camera;
  viewW: number;
  viewH: number;
  onFocus: (worldX: number, worldY: number) => void;
}) {
  return (
    <div className="minimap-wrap">
      <svg
        className="minimap"
        viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
        role="img"
        aria-label="City minimap"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const worldX = ((event.clientX - bounds.left) / bounds.width) * WORLD.width;
          const worldY = ((event.clientY - bounds.top) / bounds.height) * WORLD.height;
          onFocus(worldX, worldY);
        }}
      >
        <rect width={WORLD.width} height={WORLD.height} fill="#0d3e56" />
        <path d="M0,0 H3600 V1980 H2680 C2580,1960 2520,1900 2480,1860 H0 Z" fill="#d9d0c0" />
        {DISTRICTS.map((district) => (
          <rect
            key={district.id}
            x={district.x}
            y={district.y}
            width={district.w}
            height={district.h}
            fill={district.color}
            opacity={0.95}
          />
        ))}
        <rect
          x={-cam.x / cam.zoom}
          y={-cam.y / cam.zoom}
          width={viewW / cam.zoom}
          height={viewH / cam.zoom}
          fill="none"
          stroke="#e0b15a"
          strokeWidth={18}
        />
      </svg>
    </div>
  );
}
