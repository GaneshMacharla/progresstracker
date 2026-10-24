# ₹1 Lakh Revenue Tracker

Mobile-first web app for tracking revenue toward a ₹1,00,000 / 30-day goal and generating Instagram Story graphics from the saved records. Runs entirely in the browser — data lives in IndexedDB (Dexie); no backend or login.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # stats + money unit tests
npm run build    # type-check + production build to dist/
```

## Deploy (Vercel)

Import the folder in Vercel — it auto-detects Vite (build `npm run build`, output `dist`). No environment variables needed.

## Notes

- Money is stored as integer paise. Only `received` transactions count toward revenue; `pending` is shown separately.
- All totals (dashboard, daily log, analytics, Story image) come from one function: `computeStats` in `src/lib/stats.ts`.
- It's an installable PWA (vite-plugin-pwa): works offline after the first visit and auto-updates on the next launch after a deploy. Install via **Settings → Install the app** (Android/desktop) or Safari **Share → Add to Home Screen** (iOS). On iOS the installed app has separate storage from Safari — back up in Safari and restore inside the installed app.
- Data is per-device. Use **Settings → Backup JSON** regularly; **Restore** replaces local data with a backup. **Export CSV** exports revenue records.
