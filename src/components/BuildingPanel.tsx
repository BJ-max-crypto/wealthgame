import { useEffect } from 'react';
import { MAX_LEVEL } from '../data/catalog';
import {
  districtLabel,
  formatMoney,
  formatSigned,
  milestoneLabel,
  productionBatch,
  propertyAssetValue,
  propertyStatus,
  scaledOps,
  typeLabel,
  upgradeCost,
} from '../game/economy';
import type { BuildingDef } from '../game/types';
import { useGame } from '../state/GameContext';
import type { RouteId } from './Nav';

export function BuildingPanel({
  def,
  onClose,
  onNavigate,
}: {
  def: BuildingDef;
  onClose: () => void;
  onNavigate: (route: RouteId) => void;
}) {
  const { state, dispatch } = useGame();
  const status = propertyStatus(state, def);
  const owned = state.owned.find((entry) => entry.id === def.id);
  const level = owned?.level ?? 1;
  const ops = scaledOps(def, status === 'owned' ? level : 1);
  const nextLevel = Math.min(MAX_LEVEL, (status === 'owned' ? level : 1) + (level >= MAX_LEVEL && status === 'owned' ? 0 : 1));
  const showUpgrade = status !== 'rival' && !(status === 'owned' && level >= MAX_LEVEL);
  const upgradeFrom = status === 'owned' ? level : 1;
  const nextOps = scaledOps(def, Math.min(MAX_LEVEL, upgradeFrom + 1));
  const cost = upgradeCost(def, upgradeFrom);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  let actionLabel = 'Not for sale';
  let actionDisabled = true;
  let onAction = () => {};
  if (status === 'available') {
    actionLabel = `Buy for ${formatMoney(def.price)}`;
    actionDisabled = false;
    onAction = () => dispatch({ type: 'buy_property', id: def.id });
  } else if (status === 'owned' && level < MAX_LEVEL) {
    actionLabel = `Upgrade for ${formatMoney(upgradeCost(def, level))}`;
    actionDisabled = false;
    onAction = () => dispatch({ type: 'upgrade_property', id: def.id });
  } else if (status === 'owned') {
    actionLabel = 'Fully upgraded';
  } else if (status === 'locked') {
    actionLabel = 'Locked';
  }

  const shortfall = status === 'available' ? Math.max(0, def.price - state.cash) : 0;

  return (
    <aside className="panel" data-testid="building-panel" aria-label={`${def.name} details`}>
      <div className="panel-scroll">
        <header className="panel-head">
          <p className="kicker">
            {districtLabel(def.districtId)} · {typeLabel(def.type)}
          </p>
          <div className="panel-title-row">
            <h2>{def.name}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <p className={`badge is-${status}`}>
            {status === 'owned' && 'Owned by you'}
            {status === 'available' && 'For sale'}
            {status === 'rival' && `Owned by ${def.rivalName ?? 'a rival'}`}
            {status === 'locked' && 'Locked'}
          </p>
        </header>

        <p className="purpose">{def.purpose}</p>

        <dl className="facts">
          <div>
            <dt>Ownership</dt>
            <dd>
              {status === 'owned' && state.companyName}
              {status === 'available' && 'Available'}
              {status === 'rival' && (def.rivalName ?? 'Rival company')}
              {status === 'locked' && milestoneLabel(def.milestone)}
            </dd>
          </div>
          <div>
            <dt>{status === 'rival' ? 'Estimated value' : status === 'owned' ? 'Asset value' : 'Purchase price'}</dt>
            <dd>{formatMoney(status === 'owned' ? propertyAssetValue(def, level) : def.price)}</dd>
          </div>
          {(def.expense > 0 || def.income > 0) && status !== 'rival' && (
            <>
              <div>
                <dt>Operating expenses</dt>
                <dd>{formatMoney(ops.expense)} / day</dd>
              </div>
              <div>
                <dt>Expected income</dt>
                <dd>{formatMoney(ops.income)} / day</dd>
              </div>
              <div>
                <dt>Net operating result</dt>
                <dd className={ops.net >= 0 ? 'is-positive' : 'is-negative'}>{formatSigned(ops.net)} / day</dd>
              </div>
            </>
          )}
          {ops.capacity > 0 && status !== 'rival' && (
            <div>
              <dt>Inventory capacity</dt>
              <dd>+{ops.capacity} units</dd>
            </div>
          )}
          {def.unlocks.includes('production') && status !== 'rival' && (
            <div>
              <dt>Production</dt>
              <dd>
                {productionBatch(status === 'owned' ? level : 1).output} kit
                {productionBatch(status === 'owned' ? level : 1).output === 1 ? '' : 's'} per shift
              </dd>
            </div>
          )}
          {def.unlocks.includes('contracts') && status !== 'rival' && (
            <div>
              <dt>Shipping</dt>
              <dd>Contracts unlocked</dd>
            </div>
          )}
          {status === 'owned' && (
            <div>
              <dt>Level</dt>
              <dd>
                {level} / {MAX_LEVEL}
              </dd>
            </div>
          )}
        </dl>

        {status === 'locked' && <p className="callout">{milestoneLabel(def.milestone)} to unlock this property.</p>}
        {shortfall > 0 && <p className="callout">You are {formatMoney(shortfall)} short of the purchase price.</p>}
        {status !== 'owned' && status !== 'rival' && (def.income > 0 || def.expense > 0) && (
          <p className="fine">Income and expenses settle when you end the day, and only after you own the property.</p>
        )}

        {showUpgrade && (
          <section className="upgrade">
            <h3>Upgrade</h3>
            {def.unlocks.includes('production') ? (
              <p>
                Level {Math.min(MAX_LEVEL, upgradeFrom + 1)} runs a shift of {productionBatch(Math.min(MAX_LEVEL, upgradeFrom + 1)).output}{' '}
                electronics kits from {productionBatch(Math.min(MAX_LEVEL, upgradeFrom + 1)).steel} steel coils, labor{' '}
                {formatMoney(productionBatch(Math.min(MAX_LEVEL, upgradeFrom + 1)).labor)}. The upgrade from level {upgradeFrom} costs{' '}
                {formatMoney(cost)}.
              </p>
            ) : (
              <p>
                Level {nextLevel} {nextOps.income > 0 ? `nets ${formatSigned(nextOps.net)} / day` : 'raises capacity'}
                {nextOps.capacity > 0 ? ` and adds ${nextOps.capacity} storage` : ''}. Upgrading from level {upgradeFrom} costs{' '}
                {formatMoney(cost)}.
              </p>
            )}
          </section>
        )}

        <div className="panel-actions">
          <button type="button" className="btn primary" data-testid="panel-action" disabled={actionDisabled} onClick={onAction}>
            {actionLabel}
          </button>
          {status === 'owned' && def.unlocks.includes('production') && (
            <button type="button" className="btn" onClick={() => onNavigate('businesses')}>
              Open production
            </button>
          )}
          {status === 'owned' && def.unlocks.includes('contracts') && (
            <button type="button" className="btn" onClick={() => onNavigate('contracts')}>
              View contracts
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
