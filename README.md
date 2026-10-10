# Market Mayhem

A browser business game set in Asher Bay. You start with $500, trade goods, and buy city properties.

## Play

```bash
npm install
npm run dev
```

The city map is the home screen. Drag to pan, use the wheel or the on-screen controls to zoom, and click a building to inspect it.

## Demo economy

Progress is saved in this browser under `market-mayhem-demo-v1`. It is a local prototype, not a multiplayer account.

- Cash starts at $500. Net worth is cash + inventory at market prices + owned property assets − liabilities.
- Buying a property moves cash into an asset. Level 1 is worth the purchase price. Each upgrade adds half the purchase price to the asset value and costs the same amount.
- Retail, restaurants, offices, and leisure properties pay income and expenses when you end the day.
- Warehouses and port buildings add inventory capacity. Factories unlock a steel-to-electronics shift. Port ownership unlocks shipping contracts.
- Rival buildings are simulated companies and are not for sale.

## Checks

```bash
npm test
npm run typecheck
npm run build
```
