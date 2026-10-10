import { BUILDINGS, buildingById } from '../data/buildings';
import {
  BASE_CAPACITY,
  EVENTS,
  MAX_LEVEL,
  PRODUCTS,
  RECIPE,
  STARTING_CASH,
  contractById,
  eventById,
  productById,
} from '../data/catalog';
import { districtById } from '../data/layout';
import type {
  Action,
  ActionResult,
  BuildingDef,
  BuildingType,
  GameState,
  InventoryLot,
  Milestone,
  Ownership,
  ProductId,
  Unlock,
} from './types';

const PRICE_MIN = 0.5;
const PRICE_MAX = 1.85;

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString('en-US')}`;
}

export function formatSigned(amount: number): string {
  if (amount > 0) return `+${formatMoney(amount)}`;
  return formatMoney(amount);
}

export function createInitialState(): GameState {
  const prices = {
    coffee: 10,
    groceries: 16,
    seafood: 33,
    steel: 37,
    electronics: 96,
  };
  return {
    companyName: 'Ash & Co.',
    cash: STARTING_CASH,
    liabilities: 0,
    day: 1,
    owned: [],
    inventory: [],
    prices,
    priceHistory: {
      coffee: [14, 13, 15, 12, 11, prices.coffee],
      groceries: [20, 19, 18, 17, 16, prices.groceries],
      seafood: [26, 27, 29, 31, 32, prices.seafood],
      steel: [48, 46, 44, 42, 39, prices.steel],
      electronics: [80, 84, 88, 90, 93, prices.electronics],
    },
    eventId: 'calm',
    rngSeed: 20261010,
    trades: 0,
  };
}

export function drawRandom(seed: number): { value: number; seed: number } {
  let state = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, seed: state >>> 0 };
}

export function propertyAssetValue(def: BuildingDef, level: number): number {
  return Math.round(def.price * (1 + 0.5 * (level - 1)));
}

export function upgradeCost(def: BuildingDef, level: number): number {
  return Math.round(def.price * 0.5 * level);
}

export function scaledOps(def: BuildingDef, level: number): { income: number; expense: number; capacity: number; net: number } {
  return {
    income: def.income * level,
    expense: def.expense * level,
    capacity: def.capacity * level,
    net: (def.income - def.expense) * level,
  };
}

export function ownedRecord(state: GameState, id: string) {
  return state.owned.find((entry) => entry.id === id);
}

export function inventoryUnits(state: GameState): number {
  return state.inventory.reduce((sum, lot) => sum + lot.quantity, 0);
}

export function inventoryCapacity(state: GameState): number {
  return state.owned.reduce((sum, entry) => {
    const def = buildingById(entry.id);
    return sum + def.capacity * entry.level;
  }, BASE_CAPACITY);
}

export function inventoryMarketValue(state: GameState): number {
  return state.inventory.reduce((sum, lot) => sum + lot.quantity * (state.prices[lot.productId] ?? 0), 0);
}

export function propertyPortfolioValue(state: GameState): number {
  return state.owned.reduce((sum, entry) => sum + propertyAssetValue(buildingById(entry.id), entry.level), 0);
}

/** Cash + marked inventory + owned property assets − liabilities. */
export function netWorth(state: GameState): number {
  return state.cash + inventoryMarketValue(state) + propertyPortfolioValue(state) - state.liabilities;
}

export function milestoneMet(state: GameState, milestone: Milestone | undefined): boolean {
  if (!milestone) return true;
  if (milestone.type === 'net_worth') return netWorth(state) >= milestone.amount;
  if (milestone.type === 'owned_count') return state.owned.length >= milestone.count;
  return state.owned.some((entry) => buildingById(entry.id).type === milestone.buildingType);
}

export function milestoneLabel(milestone: Milestone | undefined): string {
  if (!milestone) return 'Available';
  if (milestone.type === 'net_worth') return `Reach a net worth of ${formatMoney(milestone.amount)}`;
  if (milestone.type === 'owned_count') {
    return `Own ${milestone.count} properties`;
  }
  return `Own a ${typeLabel(milestone.buildingType).toLowerCase()} property`;
}

export function propertyStatus(state: GameState, def: BuildingDef): Ownership {
  if (ownedRecord(state, def.id)) return 'owned';
  if (def.listing === 'rival') return 'rival';
  if (def.listing === 'locked' && !milestoneMet(state, def.milestone)) return 'locked';
  return 'available';
}

export function typeLabel(type: BuildingType): string {
  switch (type) {
    case 'office':
      return 'Office';
    case 'headquarters':
      return 'Headquarters';
    case 'retail':
      return 'Retail';
    case 'restaurant':
      return 'Restaurant';
    case 'factory':
      return 'Factory';
    case 'warehouse':
      return 'Warehouse';
    case 'port':
      return 'Port';
    case 'leisure':
      return 'Leisure';
  }
}

export function districtLabel(id: BuildingDef['districtId']): string {
  return districtById(id).name;
}

export function hasUnlock(state: GameState, unlock: Unlock): boolean {
  return state.owned.some((entry) => buildingById(entry.id).unlocks.includes(unlock));
}

export function maxFactoryLevel(state: GameState): number {
  let level = 0;
  for (const entry of state.owned) {
    const def = buildingById(entry.id);
    if (def.unlocks.includes('production')) level = Math.max(level, entry.level);
  }
  return level;
}

export function productionBatch(level: number): { output: number; steel: number; labor: number } {
  return {
    output: level,
    steel: RECIPE.steelPerOutput * level,
    labor: RECIPE.laborPerOutput * level,
  };
}

export function lotQuantity(state: GameState, productId: ProductId): number {
  return state.inventory.find((lot) => lot.productId === productId)?.quantity ?? 0;
}

export function dailyLedger(state: GameState): { income: number; expense: number; net: number } {
  return state.owned.reduce(
    (sum, entry) => {
      const ops = scaledOps(buildingById(entry.id), entry.level);
      return {
        income: sum.income + ops.income,
        expense: sum.expense + ops.expense,
        net: sum.net + ops.net,
      };
    },
    { income: 0, expense: 0, net: 0 },
  );
}

export function objectiveLine(state: GameState): string | null {
  if (state.owned.length > 0) return null;
  const starter = BUILDINGS.filter((building) => building.listing === 'available').sort((a, b) => a.price - b.price)[0];
  if (!starter) return null;
  return `Trade until you can buy ${starter.name} for ${formatMoney(starter.price)}. Prices move when you end the day.`;
}

export function goodsBasketValue(needs: { productId: ProductId; qty: number }[], prices: GameState['prices']): number {
  return needs.reduce((sum, need) => sum + need.qty * (prices[need.productId] ?? 0), 0);
}

function fail(state: GameState, message: string): ActionResult {
  return { ok: false, state, message };
}

function ok(state: GameState, message: string): ActionResult {
  return { ok: true, state, message };
}

function withLot(inventory: InventoryLot[], productId: ProductId, quantity: number, avgCost: number): InventoryLot[] {
  const rest = inventory.filter((lot) => lot.productId !== productId);
  if (quantity <= 0) return rest;
  return [...rest, { productId, quantity, avgCost }];
}

export function applyAction(state: GameState, action: Action): ActionResult {
  switch (action.type) {
    case 'buy_property':
      return buyProperty(state, action.id);
    case 'upgrade_property':
      return upgradeProperty(state, action.id);
    case 'buy_goods':
      return buyGoods(state, action.productId, action.qty);
    case 'sell_goods':
      return sellGoods(state, action.productId, action.qty);
    case 'produce':
      return produce(state);
    case 'fulfill_contract':
      return fulfillContract(state, action.id);
    case 'end_day':
      return endDay(state);
    case 'rename':
      return renameCompany(state, action.name);
    case 'reset':
      return ok(createInitialState(), 'Demo company reset. Local progress was cleared.');
    default: {
      const unknown: never = action;
      return fail(state, `Unsupported action: ${String(unknown)}`);
    }
  }
}

function buyProperty(state: GameState, id: string): ActionResult {
  const def = BUILDINGS.find((building) => building.id === id);
  if (!def) return fail(state, 'That property is not on the map.');
  const status = propertyStatus(state, def);
  if (status === 'owned') return fail(state, `You already own ${def.name}.`);
  if (status === 'rival') return fail(state, `${def.rivalName ?? 'Another company'} owns ${def.name}. It is not for sale.`);
  if (status === 'locked') return fail(state, `${def.name} is locked. ${milestoneLabel(def.milestone)}.`);
  if (state.cash < def.price) {
    return fail(
      state,
      `Not enough cash. ${def.name} costs ${formatMoney(def.price)} and you have ${formatMoney(state.cash)}.`,
    );
  }
  return ok(
    {
      ...state,
      cash: state.cash - def.price,
      owned: [...state.owned, { id: def.id, level: 1 }],
    },
    `Purchased ${def.name} for ${formatMoney(def.price)}.`,
  );
}

function upgradeProperty(state: GameState, id: string): ActionResult {
  const def = BUILDINGS.find((building) => building.id === id);
  if (!def) return fail(state, 'That property is not on the map.');
  const owned = ownedRecord(state, id);
  if (!owned) return fail(state, `Buy ${def.name} before upgrading it.`);
  if (owned.level >= MAX_LEVEL) return fail(state, `${def.name} is already at level ${MAX_LEVEL}.`);
  const cost = upgradeCost(def, owned.level);
  if (state.cash < cost) {
    return fail(state, `Not enough cash. The upgrade costs ${formatMoney(cost)} and you have ${formatMoney(state.cash)}.`);
  }
  const nextLevel = owned.level + 1;
  return ok(
    {
      ...state,
      cash: state.cash - cost,
      owned: state.owned.map((entry) => (entry.id === id ? { ...entry, level: nextLevel } : entry)),
    },
    `Upgraded ${def.name} to level ${nextLevel} for ${formatMoney(cost)}.`,
  );
}

function buyGoods(state: GameState, productId: ProductId, qty: number): ActionResult {
  const product = productById(productId);
  if (!product) return fail(state, 'Unknown product.');
  if (!Number.isInteger(qty) || qty < 1) return fail(state, 'Enter a whole number of units to buy.');
  const price = state.prices[productId];
  const cost = price * qty;
  if (state.cash < cost) {
    return fail(state, `Not enough cash. ${qty} ${product.unit}s cost ${formatMoney(cost)} and you have ${formatMoney(state.cash)}.`);
  }
  const room = inventoryCapacity(state) - inventoryUnits(state);
  if (qty > room) {
    return fail(state, `Not enough storage. You can hold ${room} more unit${room === 1 ? '' : 's'}.`);
  }
  const existing = state.inventory.find((lot) => lot.productId === productId);
  const previousQty = existing?.quantity ?? 0;
  const previousCost = existing?.avgCost ?? price;
  const avgCost = Math.round((previousCost * previousQty + price * qty) / (previousQty + qty));
  return ok(
    {
      ...state,
      cash: state.cash - cost,
      trades: state.trades + 1,
      inventory: withLot(state.inventory, productId, previousQty + qty, avgCost),
    },
    `Bought ${qty} × ${product.name} for ${formatMoney(cost)}.`,
  );
}

function sellGoods(state: GameState, productId: ProductId, qty: number): ActionResult {
  const product = productById(productId);
  if (!product) return fail(state, 'Unknown product.');
  if (!Number.isInteger(qty) || qty < 1) return fail(state, 'Enter a whole number of units to sell.');
  const existing = state.inventory.find((lot) => lot.productId === productId);
  const have = existing?.quantity ?? 0;
  if (have < qty) {
    return fail(state, `You only have ${have} ${product.unit}${have === 1 ? '' : 's'} of ${product.name.toLowerCase()}.`);
  }
  const price = state.prices[productId];
  const revenue = price * qty;
  return ok(
    {
      ...state,
      cash: state.cash + revenue,
      trades: state.trades + 1,
      inventory: withLot(state.inventory, productId, have - qty, existing?.avgCost ?? price),
    },
    `Sold ${qty} × ${product.name} for ${formatMoney(revenue)}.`,
  );
}

function produce(state: GameState): ActionResult {
  const level = maxFactoryLevel(state);
  if (level < 1) return fail(state, 'Buy a factory to run production.');
  const batch = productionBatch(level);
  const steel = state.inventory.find((lot) => lot.productId === RECIPE.inputId);
  const haveSteel = steel?.quantity ?? 0;
  if (haveSteel < batch.steel) {
    return fail(state, `This shift needs ${batch.steel} steel coils. You have ${haveSteel}.`);
  }
  if (state.cash < batch.labor) {
    return fail(state, `Labor costs ${formatMoney(batch.labor)} and you have ${formatMoney(state.cash)}.`);
  }
  const nextUnits = inventoryUnits(state) - batch.steel + batch.output;
  if (nextUnits > inventoryCapacity(state)) {
    return fail(state, 'Not enough storage for the finished kits.');
  }
  const steelAvg = steel?.avgCost ?? state.prices.steel;
  const kitCost = Math.round((steelAvg * batch.steel + batch.labor) / batch.output);
  const kits = state.inventory.find((lot) => lot.productId === RECIPE.outputId);
  const kitQty = kits?.quantity ?? 0;
  const kitAvg = kits?.avgCost ?? kitCost;
  const nextKitAvg = Math.round((kitAvg * kitQty + kitCost * batch.output) / (kitQty + batch.output));
  const withoutInputs = withLot(state.inventory, RECIPE.inputId, haveSteel - batch.steel, steelAvg);
  return ok(
    {
      ...state,
      cash: state.cash - batch.labor,
      inventory: withLot(withoutInputs, RECIPE.outputId, kitQty + batch.output, nextKitAvg),
    },
    `Assembled ${batch.output} electronics kit${batch.output === 1 ? '' : 's'} from ${batch.steel} steel coils.`,
  );
}

function fulfillContract(state: GameState, id: string): ActionResult {
  const contract = contractById(id);
  if (!contract) return fail(state, 'Unknown contract.');
  if (!hasUnlock(state, 'contracts')) {
    return fail(state, 'Buy a port property to accept shipping contracts.');
  }
  for (const need of contract.needs) {
    const have = lotQuantity(state, need.productId);
    if (have < need.qty) {
      const product = productById(need.productId);
      return fail(state, `${contract.name} needs ${need.qty} ${product?.unit ?? 'units'}. You have ${have}.`);
    }
  }
  let inventory = state.inventory;
  for (const need of contract.needs) {
    const existing = inventory.find((lot) => lot.productId === need.productId);
    inventory = withLot(inventory, need.productId, (existing?.quantity ?? 0) - need.qty, existing?.avgCost ?? 0);
  }
  return ok(
    {
      ...state,
      cash: state.cash + contract.payout,
      inventory,
      trades: state.trades + 1,
    },
    `Fulfilled ${contract.name} for ${formatMoney(contract.payout)}.`,
  );
}

function endDay(state: GameState): ActionResult {
  const ledger = dailyLedger(state);
  let seed = state.rngSeed;
  const event = eventById(state.eventId);
  const prices = { ...state.prices };
  for (const product of PRODUCTS) {
    const roll = drawRandom(seed);
    seed = roll.seed;
    const bias = event.bias[product.id] ?? 0;
    const delta = (roll.value - 0.5) * 0.28 + bias;
    const unclamped = Math.round(prices[product.id] * (1 + delta));
    const min = Math.max(1, Math.round(product.base * PRICE_MIN));
    const max = Math.round(product.base * PRICE_MAX);
    prices[product.id] = Math.min(max, Math.max(min, unclamped));
  }
  const history = { ...state.priceHistory };
  for (const product of PRODUCTS) {
    const prior = state.priceHistory[product.id] ?? [];
    history[product.id] = [...prior, prices[product.id]].slice(-12);
  }
  const eventRoll = drawRandom(seed);
  seed = eventRoll.seed;
  let eventId = state.eventId;
  if (eventRoll.value < 0.55) {
    const pick = drawRandom(seed);
    seed = pick.seed;
    eventId = EVENTS[Math.floor(pick.value * EVENTS.length)]!.id;
  }
  const next = {
    ...state,
    cash: state.cash + ledger.net,
    day: state.day + 1,
    prices,
    priceHistory: history,
    eventId,
    rngSeed: seed,
  };
  const flow =
    ledger.net === 0 ? 'No property cash flow.' : `Property cash flow ${formatSigned(ledger.net)}.`;
  const nextEvent = eventById(eventId);
  const eventNote = eventId === state.eventId ? '' : ` ${nextEvent.name}.`;
  return ok(next, `Day ${next.day} begins. ${flow}${eventNote}`);
}

function renameCompany(state: GameState, raw: string): ActionResult {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 24) return fail(state, 'Company name must be 2–24 characters.');
  if (!/^[\w&'.\- ]+$/.test(name)) return fail(state, 'Use letters, numbers, and simple punctuation.');
  return ok({ ...state, companyName: name }, `Company renamed to ${name}.`);
}

export function maxAffordableQty(state: GameState, productId: ProductId): number {
  const price = state.prices[productId];
  if (price <= 0) return 0;
  const byCash = Math.floor(state.cash / price);
  const byRoom = inventoryCapacity(state) - inventoryUnits(state);
  return Math.max(0, Math.min(byCash, byRoom));
}
