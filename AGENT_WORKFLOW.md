# 🤖 AGENT_WORKFLOW.md — AI Agent Usage Documentation

## Overview

This project was built with the assistance of **Claude (claude-sonnet-4)** acting as a primary AI coding agent throughout all phases: architecture design, domain modeling, implementation, testing, and documentation.

---

## Phase 1 — Architecture & Domain Design

### Prompt Used
```
I'm building a FuelEU Maritime compliance platform. The regulation is EU 2023/1805. 
I need hexagonal architecture with these bounded contexts:
- Routes (CRUD + baseline)
- Compliance Balance (CB = (Target - Actual) × Energy)
- Banking (Article 20 — bank/apply surplus)
- Pooling (Article 21 — multi-ship CB redistribution)

Design the core domain entities and port interfaces in TypeScript strict mode.
No framework dependencies in core. Use dependency inversion everywhere.
```

### Agent Output & Validation
The agent produced:
- `entities.ts` — `Route`, `ComplianceBalance`, `BankEntry`, `Pool`, `PoolMember` interfaces
- `FUEL_EU_CONSTANTS` object with Annex IV values
- `getEnergyContent()` and `getTargetIntensity()` pure functions
- Port interfaces for all 4 repositories + 6 use-case contracts

**Validation step:** Manually cross-referenced constants with the FuelEU PDF (pp. 27, 104–107). Confirmed:
- Target 2025 = 89.3368 ✅ (2% below 91.16)
- HFO energy content = 41,000 MJ/t ✅
- CB formula direction (positive = surplus) ✅

---

## Phase 2 — Use-Case Implementation

### Prompt Used
```
Implement the ComputeCB use case:
- Takes shipId (maps to routeId) and year
- Looks up the route via IRouteRepository
- Calculates energyInScope = fuelConsumption × energyContent(fuelType)
- CB = (targetIntensity(year) − actualGHG) × energyInScope
- Returns ComplianceBalance object
- Throw descriptive errors for missing routes
```

### Agent Output & Validation
Generated `ComputeCBUseCase` with proper dependency injection. Agent proactively:
- Added fuel-type → energy content mapping
- Handled year-based target switching
- Made the use case independent of PostgreSQL

**Refinement prompt used:**
```
The CreatePool use case needs a greedy allocation algorithm:
Sort members desc by CB, then transfer surplus to deficits.
Also enforce: deficit ships cannot exit worse, surplus ships cannot exit negative.
Write with two-pointer approach.
```

Agent implemented the two-pointer greedy allocation, which was validated against the spec rules in Articles 20–21.

---

## Phase 3 — Database Adapters

### Prompt Used
```
Write a PgRouteRepository implementing IRouteRepository using node-postgres (pg).
Map snake_case DB columns to camelCase TS properties.
The setBaseline method must use a transaction to clear all baselines then set one.
```

### Agent Output & Validation
- Produced clean `rowToRoute()` mapper function
- Correct transaction pattern with `BEGIN/COMMIT/ROLLBACK`
- `getTotalBanked()` uses `COALESCE(SUM(...), 0)` to avoid null returns
- FIFO deduction in `deductAmount()` correctly deletes/updates entries in order

---

## Phase 4 — HTTP Controllers

### Prompt Used
```
Write Express controllers for /routes, /compliance, /banking, /pools.
Each controller instantiates its own repository and use-case (composition root style).
Validate required query params and return consistent { data, error } JSON shapes.
```

Agent generated all 4 controllers with:
- Consistent error response format
- 400 vs 404 vs 500 differentiation  
- Query param validation before use-case invocation

---

## Phase 5 — Unit Tests

### Prompt Used
```
Write Jest unit tests for all 5 use cases.
Use jest.Mocked<T> for repository mocks.
Cover: happy path, edge cases (zero CB, over-bank, invalid pool sum, missing routes).
```

Agent wrote 5 test files with 20+ test cases total. Mocking pattern:
```typescript
const mockRepo: jest.Mocked<IRouteRepository> = {
  findByRouteId: jest.fn().mockResolvedValue(mockRoute),
  ...
};
```

**Manual refinement:** The `CreatePool` test for greedy allocation required a custom assertion to verify the two-pointer result (`cbAfter` values per member), which was added after initial agent output.

---

## Phase 6 — Frontend

### Prompt Used
```
Build a React + TypeScript + TailwindCSS FuelEU dashboard with 4 tabs: 
Routes, Compare, Banking, Pooling.
Use hexagonal architecture mirroring the backend: core/domain, adapters/api, adapters/ui/hooks, adapters/ui/pages.
Design theme: maritime/industrial dark — ocean blues, terminal green accents, Bebas Neue display font, JetBrains Mono for data.
```

Agent produced:
- Full Tailwind theme with custom `ocean` color palette and `fuel` accent colors
- `DataTable<T>` generic component with type-safe column definitions
- `useRoutes`, `useBanking`, `usePools` hooks with error/loading state
- Recharts `BarChart` with reference lines for FuelEU targets
- `MemberCBFetcher` side-effect component for async CB lookup in pooling

**Refinement:** Pool sum validation (red/green indicator) and "disable Create Pool if sum < 0" was added via targeted follow-up prompt.

---

## Phase 7 — Documentation

### Prompt Used
```
Write README.md with: project overview, hexagonal architecture diagram (ASCII),
setup instructions, API reference table, core formulas block, and project structure tree.
Write AGENT_WORKFLOW.md and REFLECTION.md following the assignment spec.
```

---

## Agent Tool Usage Summary

| Phase | Tool | Prompt Type | Iterations |
|-------|------|-------------|-----------|
| Architecture | Claude | Design + constraints | 2 |
| Domain entities | Claude | Spec → code | 1 |
| Use cases | Claude | Per use-case with examples | 3–4 |
| DB adapters | Claude | Interface → implementation | 2 |
| HTTP controllers | Claude | Pattern + validation rules | 1 |
| Unit tests | Claude | Coverage requirements | 2 |
| Frontend hooks | Claude | State + error handling | 2 |
| Frontend UI | Claude | Design brief + component spec | 3 |
| Documentation | Claude | Section-by-section | 1 |

---

## Prompt Engineering Patterns Used

1. **Constraint-first prompting** — Always specify TS strict mode, no framework in core, interface names upfront
2. **Example-driven** — Provide the formula or expected output before asking for implementation  
3. **Incremental refinement** — Start with happy path, then add edge-case requirements in follow-up
4. **Role specification** — "You are a backend architect implementing Hexagonal/Clean architecture"
5. **Output format specification** — "Return only the TypeScript file, no explanation needed"

---

## Validation Checklist

- [x] CB formula verified against Annex IV (pp. 27)
- [x] Target intensities cross-checked (91.16, 89.3368)
- [x] Banking rules match Article 20 (positive CB only, amount ≤ available)
- [x] Pooling rules match Article 21 (∑CB ≥ 0, no exit worse, no exit negative)
- [x] All use-case interfaces tested with mocks
- [x] TypeScript strict mode enabled on both frontend and backend
- [x] No direct DB/framework imports in `core/` folder
