export type DistrictId = 'downtown' | 'commercial' | 'industrial' | 'port' | 'waterfront';

export type BuildingType =
  | 'office'
  | 'headquarters'
  | 'retail'
  | 'restaurant'
  | 'factory'
  | 'warehouse'
  | 'port'
  | 'leisure';

export type ArtKind =
  | 'loft'
  | 'office'
  | 'hq'
  | 'shop'
  | 'diner'
  | 'factory'
  | 'warehouse'
  | 'pier'
  | 'containers'
  | 'crane'
  | 'marina'
  | 'restaurant'
  | 'boats'
  | 'resort';

export type Ownership = 'available' | 'owned' | 'rival' | 'locked';

export type Listing = 'available' | 'rival' | 'locked';

export type ProductId = 'coffee' | 'groceries' | 'seafood' | 'steel' | 'electronics';

export type Unlock = 'production' | 'contracts';

export type Milestone =
  | { type: 'net_worth'; amount: number }
  | { type: 'owned_count'; count: number }
  | { type: 'owns_type'; buildingType: BuildingType };

export interface BuildingDef {
  id: string;
  name: string;
  short: string;
  districtId: DistrictId;
  type: BuildingType;
  x: number;
  y: number;
  w: number;
  h: number;
  price: number;
  /** Daily customer or contract income at level 1. */
  income: number;
  /** Daily operating expense at level 1. */
  expense: number;
  /** Extra inventory slots granted per level. */
  capacity: number;
  unlocks: Unlock[];
  purpose: string;
  listing: Listing;
  rivalName?: string;
  milestone?: Milestone;
  art: ArtKind;
  accent: string;
}

export interface OwnedProperty {
  id: string;
  level: number;
}

export interface InventoryLot {
  productId: ProductId;
  quantity: number;
  avgCost: number;
}

export interface GameState {
  companyName: string;
  cash: number;
  liabilities: number;
  day: number;
  owned: OwnedProperty[];
  inventory: InventoryLot[];
  prices: Record<ProductId, number>;
  priceHistory: Record<ProductId, number[]>;
  eventId: string;
  rngSeed: number;
  trades: number;
}

export type Action =
  | { type: 'buy_property'; id: string }
  | { type: 'upgrade_property'; id: string }
  | { type: 'buy_goods'; productId: ProductId; qty: number }
  | { type: 'sell_goods'; productId: ProductId; qty: number }
  | { type: 'produce' }
  | { type: 'fulfill_contract'; id: string }
  | { type: 'end_day' }
  | { type: 'rename'; name: string }
  | { type: 'reset' };

export type ActionResult =
  | { ok: true; state: GameState; message: string }
  | { ok: false; state: GameState; message: string };

export interface ProductDef {
  id: ProductId;
  name: string;
  unit: string;
  base: number;
}

export interface ContractDef {
  id: string;
  name: string;
  summary: string;
  needs: { productId: ProductId; qty: number }[];
  payout: number;
}

export interface MarketEventDef {
  id: string;
  name: string;
  detail: string;
  bias: Partial<Record<ProductId, number>>;
}

export interface RivalDef {
  name: string;
  worth: number;
  note: string;
}
