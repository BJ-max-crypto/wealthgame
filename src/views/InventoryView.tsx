import { PRODUCTS } from '../data/catalog';
import { formatMoney, inventoryCapacity, inventoryMarketValue, inventoryUnits, lotQuantity } from '../game/economy';
import { useGame } from '../state/GameContext';

export function InventoryView() {
  const { state, dispatch } = useGame();
  const used = inventoryUnits(state);
  const capacity = inventoryCapacity(state);
  const held = PRODUCTS.filter((product) => lotQuantity(state, product.id) > 0);

  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Stockroom</p>
          <h1>Inventory</h1>
        </div>
        <p className="lede">
          {used} / {capacity} units on hand. Market value {formatMoney(inventoryMarketValue(state))}. Base capacity is 20. Warehouses and
          port storage add more.
        </p>
      </header>
      <div className="meter meter-wide" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (used / Math.max(1, capacity)) * 100)}%` }} />
      </div>
      {held.length === 0 ? (
        <p className="empty">The stockroom is empty. Buy goods on the Market, then sell them when the price lifts.</p>
      ) : (
        <table className="board">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Avg cost</th>
              <th>Market</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {held.map((product) => {
              const lot = state.inventory.find((entry) => entry.productId === product.id);
              const qty = lot?.quantity ?? 0;
              const price = state.prices[product.id] ?? 0;
              return (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{qty}</td>
                  <td>{formatMoney(lot?.avgCost ?? 0)}</td>
                  <td>{formatMoney(price)}</td>
                  <td>{formatMoney(qty * price)}</td>
                  <td>
                    <button type="button" className="btn" onClick={() => dispatch({ type: 'sell_goods', productId: product.id, qty })}>
                      Sell all
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
