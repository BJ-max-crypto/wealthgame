import { useEffect, useState } from 'react';
import { Hud } from './components/Hud';
import { Nav, isRoute, type RouteId } from './components/Nav';
import { useGame } from './state/GameContext';
import { BusinessesView } from './views/BusinessesView';
import { CityView } from './views/CityView';
import { ContractsView } from './views/ContractsView';
import { InventoryView } from './views/InventoryView';
import { LeaderboardView } from './views/LeaderboardView';
import { MarketView } from './views/MarketView';

function readRoute(): RouteId {
  const value = window.location.hash.replace(/^#\/?/, '');
  return isRoute(value) ? value : 'city';
}

export function App() {
  const { toast } = useGame();
  const [route, setRoute] = useState<RouteId>(() => readRoute());

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function navigate(next: RouteId) {
    const hash = `#/${next}`;
    if (window.location.hash !== hash) window.location.hash = `/${next}`;
    setRoute(next);
  }

  return (
    <div className="app">
      <Hud onNavigate={navigate} />
      <Nav route={route} onNavigate={navigate} />
      <main className="main">
        {route === 'city' && <CityView onNavigate={navigate} />}
        {route === 'market' && <MarketView />}
        {route === 'businesses' && <BusinessesView />}
        {route === 'inventory' && <InventoryView />}
        {route === 'contracts' && <ContractsView />}
        {route === 'leaderboard' && <LeaderboardView />}
        {toast && (
          <div className={`toast ${toast.kind === 'err' ? 'is-err' : 'is-ok'}`} role="status" data-testid="toast">
            {toast.text}
          </div>
        )}
      </main>
    </div>
  );
}
