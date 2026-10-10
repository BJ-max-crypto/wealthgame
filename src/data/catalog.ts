import type { ContractDef, MarketEventDef, ProductDef, RivalDef } from '../game/types';

export const BASE_CAPACITY = 20;
export const MAX_LEVEL = 3;
export const STARTING_CASH = 500;

export const PRODUCTS: ProductDef[] = [
  { id: 'coffee', name: 'Coffee beans', unit: 'crate', base: 12 },
  { id: 'groceries', name: 'Packaged groceries', unit: 'case', base: 18 },
  { id: 'seafood', name: 'Fresh seafood', unit: 'crate', base: 28 },
  { id: 'steel', name: 'Steel coils', unit: 'coil', base: 45 },
  { id: 'electronics', name: 'Electronics kits', unit: 'kit', base: 85 },
];

export const EVENTS: MarketEventDef[] = [
  {
    id: 'calm',
    name: 'Calm trading',
    detail: 'Prices are drifting without a strong theme.',
    bias: {},
  },
  {
    id: 'congestion',
    name: 'Port congestion',
    detail: 'Imported goods are getting more expensive.',
    bias: { electronics: 0.06, steel: 0.05, coffee: 0.03 },
  },
  {
    id: 'grocery-rush',
    name: 'Weekend grocery rush',
    detail: 'Household staples are in demand.',
    bias: { groceries: 0.08, coffee: 0.04 },
  },
  {
    id: 'device-slump',
    name: 'Quiet electronics aisle',
    detail: 'Devices are being discounted.',
    bias: { electronics: -0.07 },
  },
  {
    id: 'strong-catch',
    name: 'Strong harbor catch',
    detail: 'Seafood prices are easing.',
    bias: { seafood: -0.08 },
  },
  {
    id: 'mill-demand',
    name: 'Mill demand',
    detail: 'Factories are buying steel.',
    bias: { steel: 0.08 },
  },
];

export const CONTRACTS: ContractDef[] = [
  {
    id: 'steel-export',
    name: 'Northline steel export',
    summary: 'Deliver steel coils to an overseas buyer.',
    needs: [{ productId: 'steel', qty: 6 }],
    payout: 340,
  },
  {
    id: 'seafood-run',
    name: 'Harbor kitchen supply',
    summary: 'Provision waterfront restaurants with fresh seafood.',
    needs: [{ productId: 'seafood', qty: 5 }],
    payout: 175,
  },
  {
    id: 'device-delivery',
    name: 'Uptown device delivery',
    summary: 'Rush electronics kits to downtown offices.',
    needs: [{ productId: 'electronics', qty: 3 }],
    payout: 300,
  },
];

export const RIVALS: RivalDef[] = [
  { name: 'Meridian Capital', worth: 48200, note: 'Owns Apex Headquarters' },
  { name: 'Harborline Logistics', worth: 22400, note: 'Owns Container Yard A' },
  { name: 'Coastal Dining Co.', worth: 9800, note: 'Owns Jetty Cafe' },
  { name: 'Pierside Holdings', worth: 6100, note: 'Simulated waterfront portfolio' },
];

export const RECIPE = {
  name: 'Assemble electronics kits',
  inputId: 'steel' as const,
  steelPerOutput: 2,
  laborPerOutput: 12,
  outputId: 'electronics' as const,
};

export function productById(id: string): ProductDef | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function eventById(id: string): MarketEventDef {
  return EVENTS.find((event) => event.id === id) ?? EVENTS[0]!;
}

export function contractById(id: string): ContractDef | undefined {
  return CONTRACTS.find((contract) => contract.id === id);
}
