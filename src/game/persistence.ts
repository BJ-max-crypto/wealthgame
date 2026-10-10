import { BUILDINGS } from '../data/buildings';
import { MAX_LEVEL } from '../data/catalog';
import { createInitialState } from './economy';
import type { GameState } from './types';

const KEY = 'market-mayhem-demo-v1';

function isState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as GameState;
  if (typeof state.companyName !== 'string' || typeof state.cash !== 'number') return false;
  if (!Array.isArray(state.owned) || !Array.isArray(state.inventory)) return false;
  if (!state.prices || typeof state.prices.coffee !== 'number') return false;
  if (typeof state.day !== 'number' || typeof state.rngSeed !== 'number') return false;
  for (const entry of state.owned) {
    if (!BUILDINGS.some((building) => building.id === entry.id)) return false;
    if (entry.level < 1 || entry.level > MAX_LEVEL) return false;
  }
  return true;
}

/** Local demo save. This is not a secure or multiplayer account. */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { v?: number; state?: unknown };
    if (data.v !== 1 || !isState(data.state)) return null;
    return data.state;
  } catch {
    return null;
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, state }));
  } catch {
    // Ignore quota and private-mode failures. The session still plays.
  }
}

export function freshState(): GameState {
  return loadState() ?? createInitialState();
}
