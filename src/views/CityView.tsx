import { useState } from 'react';
import { BuildingPanel } from '../components/BuildingPanel';
import type { RouteId } from '../components/Nav';
import { buildingById } from '../data/buildings';
import { CityMap } from '../map/CityMap';
import { useGame } from '../state/GameContext';

export function CityView({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { state } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? buildingById(selectedId) : null;

  return (
    <div className="city-shell">
      <CityMap state={state} selectedId={selectedId} onSelect={setSelectedId} />
      {selected && <BuildingPanel def={selected} onClose={() => setSelectedId(null)} onNavigate={onNavigate} />}
    </div>
  );
}
