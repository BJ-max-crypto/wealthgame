import { RIVALS } from '../data/catalog';
import { formatMoney, netWorth } from '../game/economy';
import { useGame } from '../state/GameContext';

export function LeaderboardView() {
  const { state } = useGame();
  const rows = [
    ...RIVALS.map((rival) => ({ name: rival.name, worth: rival.worth, note: rival.note, you: false })),
    { name: state.companyName, worth: netWorth(state), note: 'Your local company', you: true },
  ].sort((a, b) => b.worth - a.worth);
  const peak = rows[0]?.worth ?? 1;

  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Standings</p>
          <h1>Leaderboard</h1>
        </div>
        <p className="lede">
          Demo standings for Asher Bay. Rival companies are simulated. Your net worth is calculated on this device and is not a live
          multiplayer rank.
        </p>
      </header>
      <ol className="ranks">
        {rows.map((row, index) => (
          <li key={row.name} className={row.you ? 'is-you' : ''}>
            <span className="rank">{index + 1}</span>
            <div>
              <strong>{row.name}</strong>
              <span className="muted">{row.note}</span>
              <span className="bar">
                <span style={{ width: `${Math.max(4, (row.worth / peak) * 100)}%` }} />
              </span>
            </div>
            <b>{formatMoney(row.worth)}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
