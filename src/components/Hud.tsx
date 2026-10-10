import { useEffect, useRef, useState } from 'react';
import { eventById } from '../data/catalog';
import {
  formatMoney,
  inventoryMarketValue,
  netWorth,
  propertyPortfolioValue,
} from '../game/economy';
import { useGame } from '../state/GameContext';
import type { RouteId } from './Nav';

export function Hud({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(state.companyName);
  const [armReset, setArmReset] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const event = eventById(state.eventId);
  const worth = netWorth(state);

  useEffect(() => {
    setName(state.companyName);
  }, [state.companyName]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [open]);

  return (
    <header className="hud">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <p className="brand-title">Market Mayhem</p>
          <p className="brand-city">Asher Bay</p>
        </div>
      </div>

      <div className="hud-stats">
        <div className="stat">
          <span>Company</span>
          <strong className="company-name">{state.companyName}</strong>
        </div>
        <div className="stat">
          <span>Cash</span>
          <strong data-testid="cash-balance" className={state.cash < 0 ? 'is-negative' : ''}>
            {formatMoney(state.cash)}
          </strong>
        </div>
        <div className="stat">
          <span>Net worth</span>
          <strong data-testid="net-worth">{formatMoney(worth)}</strong>
        </div>
        <button type="button" className="stat stat-button" onClick={() => onNavigate('businesses')}>
          <span>Properties</span>
          <strong data-testid="property-count">{state.owned.length}</strong>
        </button>
        <div className="stat">
          <span>Day</span>
          <strong>{state.day}</strong>
        </div>
      </div>

      <div className="hud-event" title={event.detail}>
        <span>Market</span>
        <strong>{event.name}</strong>
      </div>

      <button type="button" className="btn primary end-day" data-testid="end-day" onClick={() => dispatch({ type: 'end_day' })}>
        End day
      </button>

      <div className="profile" ref={menuRef}>
        <button
          type="button"
          className="profile-button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{state.companyName.slice(0, 1)}</span>
          <span className="sr-only">Company menu</span>
        </button>
        {open && (
          <div className="profile-menu" role="dialog" aria-label="Company menu">
            <p className="menu-kicker">Local demo profile</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                dispatch({ type: 'rename', name });
              }}
            >
              <label htmlFor="company-name">Company name</label>
              <div className="rename-row">
                <input
                  id="company-name"
                  value={name}
                  maxLength={24}
                  onChange={(event) => setName(event.target.value)}
                />
                <button type="submit" className="btn">
                  Save
                </button>
              </div>
            </form>
            <dl className="books">
              <div>
                <dt>Cash</dt>
                <dd>{formatMoney(state.cash)}</dd>
              </div>
              <div>
                <dt>Inventory</dt>
                <dd>{formatMoney(inventoryMarketValue(state))}</dd>
              </div>
              <div>
                <dt>Properties</dt>
                <dd>{formatMoney(propertyPortfolioValue(state))}</dd>
              </div>
              <div>
                <dt>Liabilities</dt>
                <dd>{formatMoney(state.liabilities)}</dd>
              </div>
              <div>
                <dt>Net worth</dt>
                <dd>{formatMoney(worth)}</dd>
              </div>
            </dl>
            <p className="fine">
              Progress is stored in this browser only. It is not a secure account, and trades are not live multiplayer transactions.
            </p>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (!armReset) {
                  setArmReset(true);
                  return;
                }
                dispatch({ type: 'reset' });
                setArmReset(false);
                setOpen(false);
              }}
            >
              {armReset ? 'Confirm reset' : 'Reset demo'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
