# ⚓ FuelEU Maritime — Compliance Platform

A full-stack implementation of the **FuelEU Maritime** compliance module based on Regulation (EU) 2023/1805. Built with React + TypeScript (frontend) and Node.js + PostgreSQL (backend), following **Hexagonal Architecture** throughout.

---

## 📸 Dashboard Overview

```
┌─────────────────────────────────────────────────────────┐
│  FUELEU MARITIME   Compliance Platform · EU 2023/1805   │
├──────────┬──────────┬──────────┬──────────────────────  │
│ 🛳 Routes│ 📊 Compare│ 🏦 Banking│ 🔗 Pooling            │
├──────────┴──────────┴──────────┴──────────────────────  │
│  Fleet Routes Table · Filters · Set Baseline            │
│  KPIs: Total · Compliant · Non-Compliant · Avg GHG      │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture Summary — Hexagonal (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CORE (Domain)                              │
│  entities.ts · ports/index.ts                                       │
│  usecases: ComputeCB · BankSurplus · ApplyBanked · CreatePool       │
│             RouteComparison                                          │
│  ── No framework dependencies ──                                    │
├─────────────────────────────────────────────────────────────────────┤
│                       ADAPTERS (Inbound)                            │
│  HTTP Controllers: routes · compliance · banking · pools            │
├─────────────────────────────────────────────────────────────────────┤
│                      ADAPTERS (Outbound)                            │
│  Repositories: PgRouteRepo · PgBankRepo · PgPoolRepo                │
├─────────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                                 │
│  PostgreSQL pool · migrations · seed                                │
└─────────────────────────────────────────────────────────────────────┘
```

**Frontend** mirrors the same pattern:
- `core/domain/types.ts` — shared types + pure functions
- `adapters/api/client.ts` — outbound HTTP adapter
- `adapters/ui/hooks/` — inbound React adapters
- `adapters/ui/pages/` — UI components

---

## 📦 Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ≥ 9

---

## 🚀 Setup & Run

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/fueleu-maritime.git
cd fueleu-maritime
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

npm install

# Create database
createdb fueleu_db

# Run migrations
npm run migrate

# Seed data (5 routes from spec)
npm run seed

# Start dev server (port 3001)
npm run dev
```

### 3. Frontend

```bash
cd ../frontend
npm install

# Start dev server (port 3000)
npm run dev
```

Open **http://localhost:3000** — the frontend proxies `/api/*` → `http://localhost:3001`.

---

## 🧪 Running Tests

### Backend (Jest)

```bash
cd backend
npm test
```

Tests cover all 5 use-cases:
- `ComputeCB.test.ts` — energy calculation, target intensity, surplus/deficit
- `BankSurplus.test.ts` — validation, surplus checks, over-bank prevention
- `ApplyBanked.test.ts` — FIFO deduction, over-apply prevention
- `CreatePool.test.ts` — greedy allocation, rule validation, pool sum constraint
- `RouteComparison.test.ts` — percentDiff formula, compliance flags

### Frontend (Vitest)

```bash
cd frontend
npm test
```

Tests cover:
- `domain.test.ts` — `getTargetIntensity`, `formatCB`
- `components.test.tsx` — KpiCard, ComplianceBadge, ErrorBanner

---

## 🔗 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes` | All routes |
| POST | `/routes/:id/baseline` | Set baseline route |
| GET | `/routes/comparison` | Baseline vs comparisons |
| GET | `/compliance/cb?shipId=&year=` | Compute CB snapshot |
| GET | `/compliance/adjusted-cb?shipId=&year=` | CB after bank applications |
| GET | `/banking/records?shipId=&year=` | Bank ledger |
| POST | `/banking/bank` | Bank positive CB |
| POST | `/banking/apply` | Apply banked surplus |
| GET | `/pools` | All pools |
| POST | `/pools` | Create pool |

### Sample Requests

**Get all routes:**
```bash
curl http://localhost:3001/routes
```

**Compute compliance balance:**
```bash
curl "http://localhost:3001/compliance/cb?shipId=R002&year=2024"
```

**Bank surplus:**
```bash
curl -X POST http://localhost:3001/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R002","year":2024,"amount":100000000}'
```

**Create pool:**
```bash
curl -X POST http://localhost:3001/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"members":[{"shipId":"R002","amount":758400000},{"shipId":"R003","amount":-509379000}]}'
```

---

## 📐 Core Formulas (Annex IV)

```
Energy in scope (MJ) = fuelConsumption (t) × energyContent (MJ/t)
  HFO → 41,000 MJ/t  |  LNG → 50,000 MJ/t  |  MGO → 42,700 MJ/t

Compliance Balance = (Target − Actual GHG) × Energy in scope
  Positive → Surplus  |  Negative → Deficit

Target Intensity:
  2024 → 91.16 gCO₂e/MJ
  2025 → 89.3368 gCO₂e/MJ  (2% below 91.16)

Route % Difference = ((comparison / baseline) − 1) × 100
```

---

## 🗂 Project Structure

```
fueleu-maritime/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/entities.ts
│   │   │   ├── ports/index.ts
│   │   │   └── usecases/
│   │   │       ├── ComputeCB.ts
│   │   │       ├── BankSurplus.ts
│   │   │       ├── ApplyBanked.ts
│   │   │       ├── CreatePool.ts
│   │   │       └── RouteComparison.ts
│   │   ├── adapters/
│   │   │   ├── http/
│   │   │   │   ├── routesController.ts
│   │   │   │   ├── complianceController.ts
│   │   │   │   ├── bankingController.ts
│   │   │   │   └── poolsController.ts
│   │   │   └── repositories/
│   │   │       ├── PgRouteRepository.ts
│   │   │       ├── PgBankRepository.ts
│   │   │       └── PgPoolRepository.ts
│   │   ├── infrastructure/db/
│   │   │   ├── pool.ts
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   ├── app.ts
│   │   └── index.ts
│   └── src/__tests__/
├── frontend/
│   └── src/
│       ├── core/domain/types.ts
│       ├── adapters/
│       │   ├── api/client.ts
│       │   └── ui/
│       │       ├── hooks/
│       │       │   ├── useRoutes.ts
│       │       │   ├── useBanking.ts
│       │       │   └── usePools.ts
│       │       ├── components/shared.tsx
│       │       └── pages/
│       │           ├── RoutesTab.tsx
│       │           ├── CompareTab.tsx
│       │           ├── BankingTab.tsx
│       │           └── PoolingTab.tsx
│       └── App.tsx
├── AGENT_WORKFLOW.md
├── REFLECTION.md
└── README.md
```
