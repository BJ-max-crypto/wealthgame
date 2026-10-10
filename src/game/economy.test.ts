import { describe, expect, it } from 'vitest';
import { BUILDINGS, buildingById } from '../data/buildings';
import { PRODUCTS } from '../data/catalog';
import {
  applyAction,
  createInitialState,
  inventoryCapacity,
  inventoryMarketValue,
  netWorth,
  productionBatch,
  propertyAssetValue,
  propertyStatus,
  scaledOps,
  upgradeCost,
} from './economy';

describe('starting company', () => {
  it('starts with $500 and no properties', () => {
    const state = createInitialState();
    expect(state.cash).toBe(500);
    expect(state.owned).toEqual([]);
    expect(state.liabilities).toBe(0);
    expect(netWorth(state)).toBe(500);
  });

  it('keeps the first storefront just out of reach', () => {
    const available = BUILDINGS.filter((building) => building.listing === 'available');
    const cheapest = Math.min(...available.map((building) => building.price));
    expect(cheapest).toBeGreaterThan(500);
    expect(cheapest).toBeLessThanOrEqual(650);
    expect(buildingById('night-owl').price).toBe(cheapest);
  });
});

describe('property purchase', () => {
  it('refuses a purchase when cash is short and does not charge', () => {
    const state = createInitialState();
    const owl = buildingById('night-owl');
    const result = applyAction(state, { type: 'buy_property', id: owl.id });
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(state.cash).toBe(500);
    expect(state.owned).toEqual([]);
  });

  it('deducts the price exactly once', () => {
    const owl = buildingById('night-owl');
    const result = applyAction({ ...createInitialState(), cash: owl.price }, { type: 'buy_property', id: owl.id });
    expect(result.ok).toBe(true);
    expect(result.state.cash).toBe(0);
    expect(result.state.owned).toEqual([{ id: owl.id, level: 1 }]);
    const again = applyAction(result.state, { type: 'buy_property', id: owl.id });
    expect(again.ok).toBe(false);
    expect(again.state.cash).toBe(0);
    expect(again.state.owned).toHaveLength(1);
  });

  it('keeps net worth equal to cash plus the new asset', () => {
    const owl = buildingById('night-owl');
    const start = { ...createInitialState(), cash: 1000 };
    const result = applyAction(start, { type: 'buy_property', id: owl.id });
    expect(result.state.cash).toBe(1000 - owl.price);
    expect(netWorth(result.state)).toBe(result.state.cash + propertyAssetValue(owl, 1));
    expect(propertyAssetValue(owl, 1)).toBe(owl.price);
  });

  it('blocks rival properties and locked milestones', () => {
    const rich = { ...createInitialState(), cash: 50000 };
    const hq = applyAction(rich, { type: 'buy_property', id: 'apex-hq' });
    expect(hq.ok).toBe(false);
    expect(hq.state.cash).toBe(50000);

    const modest = { ...createInitialState(), cash: 2000 };
    const civic = buildingById('civic-annex');
    expect(propertyStatus(modest, civic)).toBe('locked');
    const blocked = applyAction(modest, { type: 'buy_property', id: civic.id });
    expect(blocked.ok).toBe(false);
    expect(blocked.state.cash).toBe(2000);
    expect(propertyStatus(rich, civic)).toBe('available');
  });

  it('unlocks a port upgrade only after a port is owned', () => {
    const crane = buildingById('east-crane');
    const locked = { ...createInitialState(), cash: 10000 };
    expect(propertyStatus(locked, crane)).toBe('locked');
    const opened = {
      ...locked,
      owned: [{ id: 'pier-terminal', level: 1 }],
    };
    expect(propertyStatus(opened, crane)).toBe('available');
    const bought = applyAction(opened, { type: 'buy_property', id: crane.id });
    expect(bought.ok).toBe(true);
    expect(bought.state.cash).toBe(10000 - crane.price);
  });
});

describe('upgrades', () => {
  it('charges the upgrade cost once and raises the asset value', () => {
    const owl = buildingById('night-owl');
    const bought = applyAction({ ...createInitialState(), cash: 5000 }, { type: 'buy_property', id: owl.id });
    const cost = upgradeCost(owl, 1);
    expect(cost).toBe(Math.round(owl.price * 0.5));
    const upgraded = applyAction(bought.state, { type: 'upgrade_property', id: owl.id });
    expect(upgraded.ok).toBe(true);
    expect(upgraded.state.cash).toBe(bought.state.cash - cost);
    expect(upgraded.state.owned[0]?.level).toBe(2);
    expect(propertyAssetValue(owl, 2)).toBe(Math.round(owl.price * 1.5));
    expect(scaledOps(owl, 2)).toEqual({
      income: owl.income * 2,
      expense: owl.expense * 2,
      capacity: 0,
      net: (owl.income - owl.expense) * 2,
    });
  });

  it('rejects an upgrade the company cannot afford', () => {
    const owl = buildingById('night-owl');
    const owned = { ...createInitialState(), cash: 100, owned: [{ id: owl.id, level: 1 }] };
    const result = applyAction(owned, { type: 'upgrade_property', id: owl.id });
    expect(result.ok).toBe(false);
    expect(result.state.cash).toBe(100);
    expect(result.state.owned[0]?.level).toBe(1);
  });

  it('stops at level 3', () => {
    const owl = buildingById('night-owl');
    const maxed = { ...createInitialState(), cash: 10000, owned: [{ id: owl.id, level: 3 }] };
    const result = applyAction(maxed, { type: 'upgrade_property', id: owl.id });
    expect(result.ok).toBe(false);
    expect(result.state.owned[0]?.level).toBe(3);
  });
});

describe('net worth', () => {
  it('adds marked inventory and property assets and subtracts liabilities', () => {
    const grocery = buildingById('harbor-grocery');
    const base = createInitialState();
    const state = {
      ...base,
      cash: 200,
      liabilities: 50,
      owned: [{ id: grocery.id, level: 2 }],
      inventory: [{ productId: 'steel' as const, quantity: 2, avgCost: 30 }],
      prices: { ...base.prices, steel: 40 },
    };
    expect(inventoryMarketValue(state)).toBe(80);
    expect(netWorth(state)).toBe(200 + 80 + propertyAssetValue(grocery, 2) - 50);
  });
});

describe('trading and production', () => {
  it('buys and sells at the posted price', () => {
    const bought = applyAction(createInitialState(), { type: 'buy_goods', productId: 'coffee', qty: 4 });
    expect(bought.ok).toBe(true);
    expect(bought.state.cash).toBe(460);
    expect(bought.state.inventory).toEqual([{ productId: 'coffee', quantity: 4, avgCost: 10 }]);
    const sold = applyAction(bought.state, { type: 'sell_goods', productId: 'coffee', qty: 1 });
    expect(sold.state.cash).toBe(470);
    expect(sold.state.inventory[0]?.quantity).toBe(3);
    const cleared = applyAction(sold.state, { type: 'sell_goods', productId: 'coffee', qty: 3 });
    expect(cleared.state.cash).toBe(500);
    expect(cleared.state.inventory).toEqual([]);
  });

  it('rejects trades the stockroom cannot hold', () => {
    const result = applyAction(createInitialState(), { type: 'buy_goods', productId: 'coffee', qty: 21 });
    expect(result.ok).toBe(false);
    expect(result.state.cash).toBe(500);
    expect(result.state.inventory).toEqual([]);
  });

  it('adds warehouse capacity', () => {
    const state = { ...createInitialState(), owned: [{ id: 'northspur', level: 1 }] };
    expect(inventoryCapacity(state)).toBe(20 + buildingById('northspur').capacity);
  });

  it('settles property cash flow exactly when the day ends', () => {
    const owl = buildingById('night-owl');
    const bought = applyAction({ ...createInitialState(), cash: 5000 }, { type: 'buy_property', id: owl.id });
    const upgraded = applyAction(bought.state, { type: 'upgrade_property', id: owl.id });
    const before = upgraded.state.cash;
    const next = applyAction(upgraded.state, { type: 'end_day' });
    expect(next.ok).toBe(true);
    expect(next.state.day).toBe(2);
    expect(next.state.cash).toBe(before + owl.income * 2 - owl.expense * 2);
    for (const product of PRODUCTS) {
      const price = next.state.prices[product.id];
      expect(price).toBeGreaterThanOrEqual(Math.max(1, Math.round(product.base * 0.5)));
      expect(price).toBeLessThanOrEqual(Math.round(product.base * 1.85));
    }
  });

  it('leaves cash unchanged when no properties settle', () => {
    const next = applyAction(createInitialState(), { type: 'end_day' });
    expect(next.state.cash).toBe(500);
    expect(next.state.rngSeed).not.toBe(createInitialState().rngSeed);
  });

  it('runs a factory shift from steel and labor', () => {
    const batch = productionBatch(1);
    const state = {
      ...createInitialState(),
      cash: 100,
      owned: [{ id: 'millworks', level: 1 }],
      inventory: [{ productId: 'steel' as const, quantity: 4, avgCost: 37 }],
    };
    const made = applyAction(state, { type: 'produce' });
    expect(made.ok).toBe(true);
    expect(made.state.cash).toBe(100 - batch.labor);
    expect(made.state.inventory.find((lot) => lot.productId === 'steel')?.quantity).toBe(4 - batch.steel);
    expect(made.state.inventory.find((lot) => lot.productId === 'electronics')).toMatchObject({
      quantity: batch.output,
      avgCost: 37 * batch.steel + batch.labor,
    });
    const blocked = applyAction(createInitialState(), { type: 'produce' });
    expect(blocked.ok).toBe(false);
  });

  it('fulfills a shipping contract only with a port and the goods', () => {
    const goods = {
      ...createInitialState(),
      cash: 100,
      inventory: [{ productId: 'steel' as const, quantity: 6, avgCost: 37 }],
    };
    const denied = applyAction(goods, { type: 'fulfill_contract', id: 'steel-export' });
    expect(denied.ok).toBe(false);
    expect(denied.state.inventory[0]?.quantity).toBe(6);
    const ready = { ...goods, owned: [{ id: 'pier-terminal', level: 1 }] };
    const done = applyAction(ready, { type: 'fulfill_contract', id: 'steel-export' });
    expect(done.ok).toBe(true);
    expect(done.state.cash).toBe(100 + 340);
    expect(done.state.inventory.find((lot) => lot.productId === 'steel')).toBeUndefined();
  });
});
