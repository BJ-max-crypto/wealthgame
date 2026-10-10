import type { ReactNode } from 'react';

export type RouteId = 'city' | 'market' | 'businesses' | 'inventory' | 'contracts' | 'leaderboard';

const ITEMS: { id: RouteId; label: string; icon: ReactNode }[] = [
  {
    id: 'city',
    label: 'City',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18 V9 L10 5 L14 8 V5 H18 V18 Z" />
        <path d="M8 18 V13 H11 V18" />
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 16 L8 8 L12 13 L16 6 L20 16" />
        <path d="M4 19 H20" />
      </svg>
    ),
  },
  {
    id: 'businesses',
    label: 'Businesses',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18 V8 H10 V5 H20 V18" />
        <path d="M8 12 H8.1 M14 10 H17 M14 14 H17" />
      </svg>
    ),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8 L12 4 L20 8 L12 12 Z" />
        <path d="M4 8 V16 L12 20 L20 16 V8" />
        <path d="M12 12 V20" />
      </svg>
    ),
  },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4 H15 L19 8 V20 H7 Z" />
        <path d="M15 4 V8 H19 M10 12 H16 M10 16 H15" />
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    label: 'Leaders',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 20 V11 H4 V20 Z M13 20 V6 H10 V20 Z M19 20 V9 H16 V20 Z" />
      </svg>
    ),
  },
];

export function Nav({ route, onNavigate }: { route: RouteId; onNavigate: (route: RouteId) => void }) {
  return (
    <nav className="nav" aria-label="Game">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid={`nav-${item.id}`}
          className={route === item.id ? 'is-active' : ''}
          aria-current={route === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function isRoute(value: string): value is RouteId {
  return ITEMS.some((item) => item.id === value);
}
