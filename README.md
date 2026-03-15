# Toko Emas — Agent README

> **Every new agent or developer MUST read this file in full before writing any code.**
> This document defines the scope, rules, architecture, and business logic of the project.

---

## 1. What Is This App?

**Toko Emas** is a mobile-first PWA for managing a gold jewelry (emas perhiasan) wholesale business. It tracks:

- Sales invoices (nota penjualan) with multi-method payments and debt tracking
- Stock-in and office-return notes
- Customer accounts and receivables
- Daily gold weighing reconciliation (timbang harian)
- Business inventory and dashboard stats

**Single-user, offline-first.** All data lives in a local SQLite file. There is no cloud sync, no multi-tenant support.

**Language**: The UI is in Indonesian. Variable names, field names, and UI labels follow Indonesian conventions. Do not translate them.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma ORM |
| State | React Context API (`lib/store.tsx`) |
| Auth | Single-user auto-init (bcryptjs) |
| Toast | react-hot-toast |
| Icons | Emoji + react-icons |
| PWA | manifest.json + meta tags |

---

## 3. Project Structure

```
toko-emas/
├── app/
│   ├── api/                    # All REST API routes
│   │   ├── init/               # Auto-init single user
│   │   ├── notas/              # CRUD for nota (invoice)
│   │   ├── payments/           # CRUD for payments
│   │   ├── returs/             # CRUD for customer returns
│   │   ├── customers/          # CRUD for customers
│   │   ├── timbang/            # CRUD for daily weighing
│   │   ├── dashboard/          # Aggregated stats
│   │   └── backup/             # JSON export/import
│   ├── components/             # All UI components (client-side)
│   ├── layout.tsx              # Root layout (PWA meta, Toaster)
│   └── page.tsx                # Entry point, tab routing
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── helpers.ts              # Business logic & formatting utils
│   ├── store.tsx               # Global state (React Context)
│   └── db.ts                   # Prisma singleton
├── prisma/
│   └── schema.prisma           # Database schema
└── public/
    ├── manifest.json           # PWA manifest
    └── icons/                  # App icons (192px, 512px)
```

---

## 4. Database Models

### User
Auto-created on first run. Single user only.
- Fields: `id`, `name`, `username`, `password` (bcrypt)

### Customer
- Fields: `id`, `userId`, `name`, `store` (optional), `phone` (optional)
- Sorted: by store A-Z, then name A-Z

### Nota (Invoice)
The central model. Three types: `'sale'` | `'stock_in'` | `'stock_return'`
- `notaNo`: Auto-generated (format: `"AA 00001"`, increments per user)
- `items`: JSON array of `NotaItem[]` — each has `gross`, `pct`, `net`
- `customerName` / `customerStore`: Denormalized from Customer (for offline safety)
- Relations: `Payment[]`, `Retur[]`

### Payment
- Multiple payments allowed per nota
- Fields: `cucian[]` (scrap gold), `perhiasan[]` (jewelry), `cash_rp`, `cash_gram`, `cash_method`, `gold_price`
- All gram-based; rupiah cash is converted to grams using `gold_price`

### Retur (Customer Return)
- Items returned by customer on a nota
- Reduces net weight owed but does NOT directly reduce debt
- Fields: `items[]`, `totalGross`, `totalNet`

### Timbang (Daily Weighing)
- One record per date (upsert, not append)
- `go`: items sent out (rol, kotak, packing)
- `back`: items returned (rol, kotak, packing, plastikAmbil, plastikBawa)
- `selisih`: go.total - back.total
- `selisihFisik`: physical difference vs nota sales on that date

---

## 5. Business Logic Rules

These rules are non-negotiable. Always implement them exactly as specified.

### 5.1 Nota Number Generation
- Format: `"AA 00001"` (prefix space 5-digit-number)
- Auto-increments from the highest existing notaNo for that user
- Implemented in `helpers.ts` → `nextNotaNo()`

### 5.2 Net Weight Calculation
```
net = gross × (pct / 100)
```
Every `NotaItem` has `gross` (bruto), `pct` (kadar percentage), and `net` (netto).

### 5.3 Debt Status (`getDebtStatus`)
Location: `lib/helpers.ts`

```
totalGram   = nota.totalNet - sum(retur.totalNet)
paidGram    = sum of all payment grams (cucian + perhiasan + cash_gram)
remainingGram = totalGram - paidGram

dueDate = nota.date + 1 month
denda   = 0%  if <= 60 days overdue
          1%  if 61–90 days overdue
          2%  if > 90 days overdue

effectiveRemaining = remainingGram + (remainingGram × denda)

status = 'lunas'    if remainingGram <= 0
         'sebagian' if 0 < remainingGram < totalGram
         'belum'    if remainingGram >= totalGram
```

Denda only applies to `sale` type notas.

### 5.4 Inventory Calculation (Dashboard)
```
sisa = (stok_in total) - (sale total) + (stock_return total)
```
Calculated separately for gross and net.

### 5.5 Timbang Selisih Fisik
```
selisihFisik = selisih - total nota berat kotor (gross) for that date
```
Compares physical gold movement to recorded sales.

### 5.6 Nota Sorting
Sort by date descending, then by notaNo descending.

---

## 6. Global State

**`lib/store.tsx`** — React Context with `AppProvider` and `useApp()` hook.

```typescript
interface AppState {
  userId: string
  userName: string
  notas: NotaWithRelations[]     // All notas with parsed JSON + relations
  customers: CustomerType[]
  timbangList: TimbangRecord[]
  loading: boolean

  loadNotas: () => Promise<void>
  loadCustomers: () => Promise<void>
  loadTimbang: () => Promise<void>
  refreshAll: () => Promise<void>
}
```

**Rules**:
- Wrap all data mutations with a `refreshAll()` or the specific `load*()` call after saving
- Never manage nota/customer/timbang state locally in a component — always use the store
- The store is initialized once on mount via `/api/init`

---

## 7. API Conventions

All routes are under `app/api/`. Pattern:
- `route.ts` → `GET` (list) + `POST` (create)
- `[id]/route.ts` → `GET`, `PUT`, `DELETE`

**Request bodies always include `userId`** — every record is scoped to the single user.

JSON fields (`items`, `cucian`, `perhiasan`, `go`, `back`) are stored as JSON strings in SQLite and must be parsed after retrieval. Use the helper functions in `lib/helpers.ts`:
- `parseNota()`, `parsePayment()`, `parseRetur()`

---

## 8. UI & Styling Rules

- **Mobile-first**. Max container width: 768px. Always test at phone screen size.
- **Bottom navigation** (`BottomNav.tsx`): 4 tabs — Dashboard, Nota, Customer, Timbang
- **Modals**: Use `Modal.tsx` for sheets (bottom slide-up) and center dialogs
- **Confirmations**: Use `ConfirmDialog.tsx` for destructive actions
- **Toasts**: Use `react-hot-toast` for success/error feedback

### Color Palette
| Usage | Color |
|-------|-------|
| Primary accent | Amber (amber-600 to amber-800) |
| Inventory panels | Blue (blue-700 to blue-800) |
| Sales panels | Amber (amber-700) |
| Lunas (paid) | Green |
| Sebagian (partial) | Yellow |
| Belum (unpaid) | Red |
| Stok masuk badge | Blue |
| Retur badge | Purple |
| Background | Cream (`#f8f5ee`, `#ede0c4`) |

---

## 9. Key Types (lib/types.ts)

```typescript
NotaItem          // { gross, pct, net }
CucianItem        // { totalGram, pieces }
PerhiasanItem     // { gross, pct, net }
NotaWithRelations // Nota with parsed items[], Payment[], Retur[]
PaymentWithParsed // Payment with parsed cucian[], perhiasan[]
ReturWithParsed   // Retur with parsed items[]
DebtStatus        // Full debt calculation result
```

Always use these types. Do not define parallel interfaces for the same data shape.

---

## 10. Key Helpers (lib/helpers.ts)

| Function | Purpose |
|----------|---------|
| `fmtGram(g)` | Format grams → "1.234 g" |
| `fmtRp(rp)` | Format rupiah → "Rp 1.234.567" |
| `fmtDate(str)` | Format ISO date → "14 Mar 2026" (id-ID) |
| `todayStr()` | Current date as "YYYY-MM-DD" |
| `nextNotaNo(notas[])` | Generate next nota number |
| `getDebtStatus(nota, payments, returs)` | Full debt calculation |
| `getNetAfterRetur(returs, gross, net)` | Net weight minus customer returns |
| `parseNota()` / `parsePayment()` / `parseRetur()` | Parse DB JSON fields |
| `customerDisplayName(c)` | Show store if exists, else name |

---

## 11. What NOT to Do

- **Do not add multi-user support.** The app is intentionally single-user.
- **Do not add server-side rendering (SSR) to business logic.** All API calls go through REST routes. Components are client-side.
- **Do not rename Indonesian field names or labels** (nota, retur, timbang, piutang, kadar, dll.). These are domain terms, not errors.
- **Do not change the nota number format.** It is a business requirement.
- **Do not skip `refreshAll()` after mutations.** The store will go stale.
- **Do not create new state management patterns.** Use the existing Context store.
- **Do not add a rupiah-only payment without also setting `gold_price`** — cash rupiah is meaningless without a gold price for conversion.
- **Do not add fields to Prisma models without running `db:push`** and updating the relevant `parse*` helpers and TypeScript types.

---

## 12. Setup (Quick Reference)

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed      # Creates admin user (optional)
npm run dev          # Starts at http://localhost:3000
```

Default credentials after seed: `admin` / `admin123`

---

## 13. Scope Boundaries

This is a **local business tool**, not a SaaS product. Keep changes:
- Focused on the four core tabs (Dashboard, Nota, Customer, Timbang)
- Offline-compatible (no external API dependencies in business logic)
- Mobile-usable (no desktop-only interactions)
- Within the existing REST + Context architecture

When in doubt, do less and ask. Avoid over-engineering.
