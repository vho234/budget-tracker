# Budget Tracker

A personal budget tracking app with a glass-morphism UI. Fully offline — all data is stored locally in your browser (IndexedDB). No backend or account required.

## Features

- 💰 Track expenses and income
- 📊 Visual dashboards with charts (spending by category, budget vs actual, trends)
- 🏷️ Custom categories, payment methods, and income sources
- 🔄 Recurring transactions (auto-generated)
- 🎯 Monthly budget goals with progress tracking
- 🔒 Optional PIN lock for privacy
- 📦 Export/import data as JSON backup
- 🌙 Dark mode glass-morphism design

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Clone and Run

```bash
git clone https://github.com/vho234/budget-tracker.git
cd budget-tracker
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with static files you can deploy anywhere (GitHub Pages, Vercel, Netlify, etc.).

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- Dexie (IndexedDB wrapper)
- Recharts
- React Router v7

## Data Storage

All data stays in your browser's IndexedDB. Nothing is sent to any server. Updating the app (pulling new code) does **not** erase your data — only clearing your browser's site data would do that.
