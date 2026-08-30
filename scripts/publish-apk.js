#!/usr/bin/env node
// Builds the web app, syncs it into the Android project, runs a signed
// release build, and drops the finished APK where it's easy to find —
// plus writes app-meta.json so the in-app update-check (if you wire one
// up the same way as Twin Hearts) has something to compare against.
//
// Requires, on the machine you run this on (not in this chat sandbox):
//   - Android Studio / the Android SDK + a JDK on PATH
//   - A release keystore, referenced from android/app/build.gradle or
//     android/keystore.properties (NOT committed to git — see below)
//
// Usage: npm run android:release

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const pkg = JSON.parse(execSync('cat package.json', { cwd: root }).toString());

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

console.log(`Building Devi Youth v${pkg.version} for Android…`);

run('npx vite build');
run('npx cap sync android');

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(`cd android && ${gradlew} assembleRelease`);

const builtApk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
if (!existsSync(builtApk)) {
  console.error('\nBuild finished but no signed APK was found at the expected path.');
  console.error('Check android/app/build.gradle has a release signingConfig set up.');
  process.exit(1);
}

const outDir = path.join(root, 'releases');
mkdirSync(outDir, { recursive: true });
const outApk = path.join(outDir, `devi-youth-v${pkg.version}.apk`);
copyFileSync(builtApk, outApk);

writeFileSync(
  path.join(outDir, 'app-meta.json'),
  JSON.stringify({ version: pkg.version, builtAt: new Date().toISOString() }, null, 2)
);

console.log(`\n✔ Signed APK ready: ${outApk}`);
console.log('Share this file directly (WhatsApp/Drive) for sideloading, or upload it to the Play Console.');
