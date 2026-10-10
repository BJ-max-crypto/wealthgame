import type { DistrictId } from '../game/types';

/** Asher Bay, in world pixels. The origin is the northwest corner. */
export const WORLD = { width: 3600, height: 2200 };

export interface HRoad {
  id: string;
  name: string;
  y: number;
  x1: number;
  x2: number;
  w: number;
}

export interface VRoad {
  id: string;
  name: string;
  x: number;
  y1: number;
  y2: number;
  w: number;
}

export const H_ROADS: HRoad[] = [
  { id: 'north', name: '', y: 40, x1: 0, x2: 3600, w: 46 },
  { id: 'broadway', name: 'Broadway', y: 640, x1: 0, x2: 3600, w: 80 },
  { id: 'market', name: 'Market Street', y: 1220, x1: 0, x2: 3600, w: 64 },
  { id: 'harbor', name: 'Harbor Road', y: 1760, x1: 0, x2: 2556, w: 58 },
];

export const V_ROADS: VRoad[] = [
  { id: 'west', name: 'West Dock St', x: 48, y1: 0, y2: 1860, w: 52 },
  { id: 'foundry', name: 'Foundry Ave', x: 920, y1: 0, y2: 1860, w: 56 },
  { id: 'main', name: 'Main Street', x: 1760, y1: 0, y2: 1860, w: 64 },
  { id: 'coast', name: 'Coast Avenue', x: 2500, y1: 0, y2: 1980, w: 56 },
  { id: 'pier', name: 'Pier Street', x: 3180, y1: 640, y2: 1980, w: 48 },
];

export interface DistrictZone {
  id: DistrictId;
  name: string;
  short: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: { x: number; y: number };
}

export const DISTRICTS: DistrictZone[] = [
  {
    id: 'downtown',
    name: 'Downtown',
    short: 'Downtown',
    x: 116,
    y: 100,
    w: 2368,
    h: 524,
    color: '#e3d7c2',
    label: { x: 480, y: 600 },
  },
  {
    id: 'commercial',
    name: 'Commercial Row',
    short: 'Commercial',
    x: 116,
    y: 736,
    w: 1628,
    h: 468,
    color: '#efe2ce',
    label: { x: 430, y: 1148 },
  },
  {
    id: 'industrial',
    name: 'Industrial Zone',
    short: 'Industrial',
    x: 116,
    y: 1300,
    w: 1628,
    h: 444,
    color: '#d5d2cb',
    label: { x: 1480, y: 1688 },
  },
  {
    id: 'port',
    name: 'Port',
    short: 'Port',
    x: 1840,
    y: 1300,
    w: 644,
    h: 780,
    color: '#d4cec2',
    label: { x: 2140, y: 2140 },
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    short: 'Waterfront',
    x: 2572,
    y: 100,
    w: 960,
    h: 1860,
    color: '#d5e3c8',
    label: { x: 2740, y: 1700 },
  },
];

export interface ParkingLot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
}

export const PARKING: ParkingLot[] = [
  { id: 'loft-lot', x: 150, y: 368, w: 300, h: 220, cols: 3, rows: 4 },
  { id: 'row-west', x: 150, y: 1052, w: 720, h: 140, cols: 8, rows: 2 },
  { id: 'row-east', x: 1010, y: 1048, w: 680, h: 140, cols: 8, rows: 2 },
];

export function districtById(id: DistrictId): DistrictZone {
  const district = DISTRICTS.find((entry) => entry.id === id);
  if (!district) throw new Error(`Unknown district ${id}`);
  return district;
}
