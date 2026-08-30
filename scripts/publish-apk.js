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
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

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

// 1) A dated copy in releases/ for sideloading directly (WhatsApp, Drive).
const outDir = path.join(root, 'releases');
mkdirSync(outDir, { recursive: true });
const outApk = path.join(outDir, `devi-youth-v${pkg.version}.apk`);
copyFileSync(builtApk, outApk);

// 2) A stable-named copy in public/downloads/ — this is what the "Download"
// button and the periodic in-app ad both link to (see useAppMeta.js).
// Because it's a fixed filename, the villager app never needs a code
// change when a new version ships: commit + push this file (and
// app-meta.json below), Vercel's own `vite build` copies public/ into
// dist/ the same way it always does, and the download link
// automatically starts serving the new APK.
const publicDownloadsDir = path.join(root, 'public/downloads');
mkdirSync(publicDownloadsDir, { recursive: true });
const publicApk = path.join(publicDownloadsDir, 'devi-youth.apk');
copyFileSync(builtApk, publicApk);

const meta = { version: pkg.version, builtAt: new Date().toISOString() };
writeFileSync(path.join(outDir, 'app-meta.json'), JSON.stringify(meta, null, 2));
writeFileSync(path.join(publicDownloadsDir, 'app-meta.json'), JSON.stringify(meta, null, 2));

console.log(`\n✔ Signed APK ready: ${outApk}`);
console.log(`✔ In-app download updated: public/downloads/devi-youth.apk (v${pkg.version})`);
console.log('\nNext: commit public/downloads/ and push — once Vercel redeploys, the');
console.log('Download button and the install-nudge banner both serve this version.');
