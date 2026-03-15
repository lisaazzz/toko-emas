# Toko Emas — Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation

```bash
cd C:\Users\Lisa\Downloads\toko-emas
npm install
```

## Database Setup

The app uses Prisma with SQLite by default.

1. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

2. Push the schema to the database (creates the SQLite file):
   ```bash
   npm run db:push
   ```

3. (Optional) Seed the database with an initial user:
   ```bash
   npm run db:seed
   ```

4. (Optional) Open Prisma Studio to inspect data:
   ```bash
   npm run db:studio
   ```

## Running the App

### Development mode

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
npm run start
```

## App Structure

```
toko-emas/
├── app/
│   ├── components/         # All UI components
│   │   ├── BottomNav.tsx   # Fixed bottom navigation bar
│   │   ├── DashboardTab.tsx
│   │   ├── NotaTab.tsx
│   │   ├── NotaForm.tsx
│   │   ├── NotaDetail.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── ReturForm.tsx
│   │   ├── CustomerTab.tsx
│   │   └── TimbangTab.tsx
│   ├── api/                # Backend API routes (already done)
│   ├── layout.tsx
│   ├── page.tsx            # Main entry point
│   └── globals.css
├── lib/
│   ├── store.ts            # React context / global state
│   ├── helpers.ts          # Utility functions
│   ├── types.ts            # TypeScript interfaces
│   └── db.ts               # Prisma client
├── prisma/
│   └── schema.prisma
└── public/
    ├── manifest.json       # PWA manifest
    └── icons/              # App icons (icon-192.png, icon-512.png)
```

## Features

- **Dashboard**: Inventory overview (stok masuk, retur kantor, sisa stok) and sales summary (total nota, piutang, penjualan hari ini). Includes backup/restore via JSON.
- **Nota**: Create, view, edit, and delete sales notes (penjualan), stock-in notes (stok masuk), and office-return notes (retur kantor). Supports per-nota payments and customer returns.
- **Customer**: Manage customer list with name, store name, and phone. Sorted by store name then personal name.
- **Timbang Harian**: Daily weight recording (pergi/pulang), with automatic selisih fisik calculation against nota berat kotor for that date.

## PWA / Mobile Installation

The app is configured as a Progressive Web App. On mobile Chrome/Safari, tap "Add to Home Screen" to install it as a standalone app.

Note: Place actual PNG icon files at:
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)
