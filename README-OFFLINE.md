# Memora — Offline-first Android (Capacitor + SQLite)

This is a migration of the original Memora React app to a fully offline Capacitor Android application. UI, navigation, styling, animations, and component code are preserved.

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind 3 + Vite 5 (unchanged from original)
- **Shell**: Capacitor 6 (Android WebView)
- **Local data**: `@capacitor-community/sqlite` (native on Android, jeep-sqlite + IndexedDB in the browser preview)
- **Auth**: Local accounts with `bcryptjs`-hashed passwords; session token persisted via `@capacitor/preferences`
- **Supabase removed**: replaced by a drop-in shim at `src/lib/supabase.ts` that exposes the same `from(...).select/insert/update/delete` and `auth.*` API the original components already use. No `@supabase/supabase-js` dependency.

## Files of interest

- `src/lib/db.ts` — opens the SQLite database, runs migrations, JSON/boolean coercion helpers
- `src/lib/supabase.ts` — Supabase-compatible shim (Auth + QueryBuilder)
- `capacitor.config.ts` — Capacitor app config (`appId: app.memora.alpha`)

## Build an APK

You will need Android Studio + Android SDK on a build machine.

```bash
npm install            # or bun install
npm run build          # produces dist/
npx cap add android    # one-time, generates the android/ project
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Offline behavior

The app runs entirely without internet:
- All reads/writes go to the local SQLite database
- Sign-up / sign-in performed locally against the `users` table
- Sessions persist across app restarts and device reboots via Capacitor Preferences
