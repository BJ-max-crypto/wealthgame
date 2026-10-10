import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { applyAction } from '../game/economy';
import { freshState, saveState } from '../game/persistence';
import type { Action, ActionResult, GameState } from '../game/types';

export interface Toast {
  kind: 'ok' | 'err';
  text: string;
}

interface GameContextValue {
  state: GameState;
  dispatch: (action: Action) => void;
  toast: Toast | null;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => freshState());
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const notify = useCallback((next: Toast) => {
    setToast(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      const result: ActionResult = applyAction(stateRef.current, action);
      stateRef.current = result.state;
      setState(result.state);
      notify({ kind: result.ok ? 'ok' : 'err', text: result.message });
    },
    [notify],
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, toast }), [state, dispatch, toast]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used within GameProvider');
  return value;
}
