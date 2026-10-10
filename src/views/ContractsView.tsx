import { CONTRACTS, productById } from '../data/catalog';
import { formatMoney, goodsBasketValue, hasUnlock, lotQuantity } from '../game/economy';
import { useGame } from '../state/GameContext';

export function ContractsView() {
  const { state, dispatch } = useGame();
  const unlocked = hasUnlock(state, 'contracts');

  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Harbor desk</p>
          <h1>Contracts</h1>
        </div>
        <p className="lede">
          {unlocked
            ? 'Your port property can fulfill these shipping jobs. Compare the payout with the goods’ current market value.'
            : 'Shipping contracts stay closed until you own a port building such as Pier 1 Terminal or the Bonded Warehouse.'}
        </p>
      </header>
      <div className="contract-list">
        {CONTRACTS.map((contract) => {
          const market = goodsBasketValue(contract.needs, state.prices);
          const ready = contract.needs.every((need) => lotQuantity(state, need.productId) >= need.qty);
          return (
            <article key={contract.id} className="contract">
              <header>
                <h2>{contract.name}</h2>
                <p>{contract.summary}</p>
              </header>
              <ul>
                {contract.needs.map((need) => {
                  const product = productById(need.productId);
                  return (
                    <li key={need.productId}>
                      {need.qty} {product?.name ?? need.productId} · you have {lotQuantity(state, need.productId)}
                    </li>
                  );
                })}
              </ul>
              <p className="fine">
                Pays {formatMoney(contract.payout)}. Current market value {formatMoney(market)}.
                {contract.payout >= market ? ' Above the current market.' : ' Below the current market.'}
              </p>
              <button
                type="button"
                className="btn primary"
                disabled={!unlocked}
                onClick={() => dispatch({ type: 'fulfill_contract', id: contract.id })}
              >
                {unlocked ? (ready ? 'Fulfill' : 'Short on goods') : 'Needs a port'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
