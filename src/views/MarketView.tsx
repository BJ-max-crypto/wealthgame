import { useState } from 'react';
import { PRODUCTS } from '../data/catalog';
import { eventById } from '../data/catalog';
import {
  formatMoney,
  inventoryCapacity,
  inventoryUnits,
  lotQuantity,
  maxAffordableQty,
} from '../game/economy';
import type { ProductId } from '../game/types';
import { useGame } from '../state/GameContext';

function Spark({ values }: { values: number[] }) {
  const width = 92;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const rising = values[values.length - 1]! >= values[0]!;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={rising ? '#1f7a4d' : '#a33b32'} strokeWidth={1.6} />
    </svg>
  );
}

export function MarketView() {
  const { state, dispatch } = useGame();
  const [productId, setProductId] = useState<ProductId>('coffee');
  const [qty, setQty] = useState(1);
  const product = PRODUCTS.find((entry) => entry.id === productId) ?? PRODUCTS[0]!;
  const price = state.prices[product.id] ?? 0;
  const held = lotQuantity(state, product.id);
  const room = inventoryCapacity(state) - inventoryUnits(state);
  const affordable = maxAffordableQty(state, product.id);
  const history = state.priceHistory[product.id] ?? [price];
  const vsBase = product.base === 0 ? 0 : Math.round(((price - product.base) / product.base) * 100);
  const event = eventById(state.eventId);

  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Trading floor</p>
          <h1>Market</h1>
        </div>
        <p className="lede">
          {event.name}. {event.detail} Prices move when you end the day. Buy below the usual price, sell above it.
        </p>
      </header>

      <div className="market-layout">
        <table className="board">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Vs typical</th>
              <th>Held</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((entry) => {
              const current = state.prices[entry.id] ?? 0;
              const delta = entry.base === 0 ? 0 : Math.round(((current - entry.base) / entry.base) * 100);
              return (
                <tr
                  key={entry.id}
                  className={entry.id === product.id ? 'is-selected' : ''}
                  onClick={() => setProductId(entry.id)}
                >
                  <td>
                    <strong>{entry.name}</strong>
                    <span className="muted">{entry.unit}</span>
                  </td>
                  <td>{formatMoney(current)}</td>
                  <td className={delta > 0 ? 'is-negative' : delta < 0 ? 'is-positive' : ''}>
                    {delta > 0 ? `${delta}% above` : delta < 0 ? `${Math.abs(delta)}% below` : 'Typical'}
                  </td>
                  <td>{lotQuantity(state, entry.id)}</td>
                  <td>
                    <Spark values={state.priceHistory[entry.id] ?? [current]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <form
          className="ticket"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <p className="kicker">Order</p>
          <h2>{product.name}</h2>
          <p className="ticket-price">{formatMoney(price)}</p>
          <p className="fine">
            {vsBase > 0 ? `${vsBase}% above` : vsBase < 0 ? `${Math.abs(vsBase)}% below` : 'At'} the typical price of{' '}
            {formatMoney(product.base)}. You hold {held}. Storage left: {room}.
          </p>
          <Spark values={history} />
          <label htmlFor="qty">Quantity</label>
          <div className="qty-row">
            <button type="button" className="btn" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
              −
            </button>
            <input
              id="qty"
              inputMode="numeric"
              value={qty}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) setQty(Math.max(1, Math.min(99, Math.floor(next))));
              }}
            />
            <button type="button" className="btn" onClick={() => setQty((value) => Math.min(99, value + 1))} aria-label="Increase quantity">
              +
            </button>
            <button type="button" className="btn" onClick={() => setQty(Math.max(1, affordable))}>
              Max
            </button>
          </div>
          <p className="fine">
            Buy {formatMoney(price * qty)} · Sell {formatMoney(price * Math.min(qty, held))}
          </p>
          <div className="ticket-actions">
            <button type="button" className="btn primary" data-testid="buy-goods" onClick={() => dispatch({ type: 'buy_goods', productId: product.id, qty })}>
              Buy
            </button>
            <button type="button" className="btn" data-testid="sell-goods" onClick={() => dispatch({ type: 'sell_goods', productId: product.id, qty })}>
              Sell
            </button>
          </div>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (inventoryUnits(state) / Math.max(1, inventoryCapacity(state))) * 100)}%` }} />
          </div>
          <p className="fine">
            Stockroom {inventoryUnits(state)} / {inventoryCapacity(state)}. Warehouses raise the limit.
          </p>
          <p className="fine">Cash {formatMoney(state.cash)} is a local demo balance.</p>
        </form>
      </div>
    </section>
  );
}
