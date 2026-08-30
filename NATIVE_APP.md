# Devi Youth — Native Android App

This project is now wrapped with [Capacitor](https://capacitorjs.com), the
same approach used for Twin Hearts. The native app is a thin shell around
your **live Vercel deployment** (`capacitor.config.ts` → `server.url`) —
it is not a separate copy of the site. That means:

- Every push to your Vercel deployment updates the app instantly for
  everyone who has it installed — no rebuild, no re-publish, for any
  change that's purely in the web app (donations, gallery, content, all
  of it).
- You only need to rebuild the native shell itself when something
  *native* changes: the app icon, splash screen, permissions, or a
  native plugin (push notifications, haptics, etc.).

Everything below needs to run on your own machine (or Claude Code /
Claude Desktop with full network + Android SDK access) — this chat
sandbox can install npm packages and scaffold files, but can't reach
Google's Maven repo or the Gradle distribution servers to actually
compile an APK.

## One-time setup

1. **Install Android Studio** (includes the Android SDK) if you don't
   already have it from the Twin Hearts project.
2. **Open the project**:
   ```
   npm install
   npx cap sync android
   npm run cap:open
   ```
   This opens `android/` in Android Studio. Let Gradle finish syncing
   the first time — it'll download the Android Gradle Plugin, which is
   why this step needs to happen outside this chat.
3. **Create a release keystore** (one-time, ever — back this up
   somewhere safe, losing it means you can never update the app again
   under the same identity):
   ```
   keytool -genkey -v -keystore devi-youth-release.keystore \
     -alias devi-youth -keyalg RSA -keysize 2048 -validity 10000
   ```
   Put the resulting `.keystore` file in `android/`, then:
   ```
   cp android/keystore.properties.example android/keystore.properties
   ```
   and fill in the real passwords. Both the `.keystore` file and
   `keystore.properties` are gitignored on purpose — never commit them.

## Building a signed release APK

```
npm run android:release
```

This builds the web app, syncs it into the native project, runs a
signed release build, and drops the finished APK in `releases/`. Share
that file directly for sideloading (WhatsApp/Drive), or upload it to
the Play Console.

## Everyday development

If you're just changing the web app (which is most of the time), you
don't need to touch Android at all — deploy to Vercel as normal and
the app picks it up automatically.

Only run `npm run cap:sync` + reopen Android Studio when you change:
- `public/icon-*.png` (app icon)
- `capacitor.config.ts` (app name, colors, permissions)
- Anything under `android/` directly

## Getting it onto the Play Store (optional, ~$25 one-time)

1. Create a [Google Play Console](https://play.google.com/console)
   account.
2. Create a new app, upload the signed APK (or switch to an `.aab`
   bundle — Android Studio's Build menu can generate one the same way).
3. Fill in the store listing — you already have the icon and splash
   assets generated in `android/app/src/main/res/`, so screenshots are
   the main thing left to prepare.
4. First review typically takes a few days; updates after that are
   usually much faster.

## Push notifications (natural next step)

Since this is now a real native shell, `@capacitor/push-notifications`
becomes available — that's the feature that makes the "premium" feel
land the most for a festival app (instant alerts for new announcements
without anyone opening the app). Happy to wire that up next.
