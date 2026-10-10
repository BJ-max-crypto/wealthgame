import { buildingById } from '../data/buildings';
import {
  dailyLedger,
  districtLabel,
  formatMoney,
  formatSigned,
  hasUnlock,
  lotQuantity,
  productionBatch,
  scaledOps,
  typeLabel,
  upgradeCost,
} from '../game/economy';
import { useGame } from '../state/GameContext';

export function BusinessesView() {
  const { state, dispatch } = useGame();
  const ledger = dailyLedger(state);
  const factoryLevel = state.owned.reduce((max, entry) => {
    const def = buildingById(entry.id);
    return def.unlocks.includes('production') ? Math.max(max, entry.level) : max;
  }, 0);
  const batch = factoryLevel > 0 ? productionBatch(factoryLevel) : null;

  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Operations</p>
          <h1>Businesses</h1>
        </div>
        <p className="lede">
          Owned properties settle when you end the day. Today&apos;s books: income {formatMoney(ledger.income)}, expenses{' '}
          {formatMoney(ledger.expense)}, net {formatSigned(ledger.net)}.
        </p>
      </header>

      {batch && (
        <section className="inset">
          <h2>Factory shift</h2>
          <p>
            Turn {batch.steel} steel coils into {batch.output} electronics kit{batch.output === 1 ? '' : 's'}. Labor{' '}
            {formatMoney(batch.labor)}. You have {lotQuantity(state, 'steel')} steel.
          </p>
          <button type="button" className="btn primary" data-testid="produce" onClick={() => dispatch({ type: 'produce' })}>
            Run shift
          </button>
        </section>
      )}

      {state.owned.length === 0 ? (
        <p className="empty">You do not own a property yet. Inspect Commercial Row and Exchange Square for the first storefronts.</p>
      ) : (
        <table className="board">
          <thead>
            <tr>
              <th>Property</th>
              <th>District</th>
              <th>Level</th>
              <th>Daily net</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.owned.map((entry) => {
              const def = buildingById(entry.id);
              const ops = scaledOps(def, entry.level);
              return (
                <tr key={entry.id}>
                  <td>
                    <strong>{def.name}</strong>
                    <span className="muted">{typeLabel(def.type)}</span>
                  </td>
                  <td>{districtLabel(def.districtId)}</td>
                  <td>{entry.level}</td>
                  <td className={ops.net >= 0 ? 'is-positive' : 'is-negative'}>{formatSigned(ops.net)}</td>
                  <td>
                    {entry.level < 3 && (
                      <button type="button" className="btn" onClick={() => dispatch({ type: 'upgrade_property', id: def.id })}>
                        Upgrade · {formatMoney(upgradeCost(def, entry.level))}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!hasUnlock(state, 'production') && state.owned.length > 0 && (
        <p className="fine">Millworks Factory unlocks a production shift. Port buildings unlock shipping contracts.</p>
      )}
    </section>
  );
}
