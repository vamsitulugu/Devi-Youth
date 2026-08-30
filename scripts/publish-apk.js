#!/usr/bin/env node
// Builds the web app, syncs it into the Android project, runs a signed
// release build, then uploads the resulting APK to Vercel Blob Storage
// (a real hosting/CDN service) instead of committing the binary to git.
//
// This matches the Twin Hearts (us-app) release flow: the APK itself
// never touches git — only a small app-meta.json pointer does, holding
// the current version number and a permanent, cache-busted Blob URL.
// The in-app Download button always reads that URL fresh, so the same
// button keeps working release after release with zero code changes.
//
// Requires, on the machine you run this on (not in this chat sandbox):
//   - Android Studio / the Android SDK + a JDK on PATH
//   - A release keystore, referenced from android/keystore.properties
//     (NOT committed to git — see android/keystore.properties.example)
//   - A Vercel Blob Storage token in .env.local as BLOB_READ_WRITE_TOKEN
//     (create a Blob store in your Vercel dashboard, copy its token —
//     .env.local is already gitignored, so this never leaks to git)
//
// Usage: npm run android:release

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
// dotenv only auto-loads a file literally named ".env" — this project's
// secrets live in ".env.local" instead (matching the *.local gitignore
// pattern), so the path has to be given explicitly or the token below
// is never found even when the file is right there.
loadEnv({ path: path.join(root, '.env.local') });

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('❌ Missing BLOB_READ_WRITE_TOKEN environment variable.');
    console.error('   Create a Blob store on your Vercel dashboard, copy its token, and put it in .env.local:');
    console.error('   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."');
    process.exit(1);
  }

  let put;
  try {
    ({ put } = await import('@vercel/blob'));
  } catch {
    console.error('❌ The "@vercel/blob" package is not installed. Run: npm install');
    process.exit(1);
  }

  console.log(`Building Devi Youth v${pkg.version} for Android…`);

  run('npx vite build');
  run('npx cap sync android');

  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  run(`cd android && ${gradlew} assembleRelease`);

  const builtApk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
  if (!existsSync(builtApk)) {
    console.error('\nBuild finished but no signed APK was found at the expected path.');
    console.error('Check android/keystore.properties has a valid signingConfig set up.');
    process.exit(1);
  }

  const sizeBytes = statSync(builtApk).size;
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  console.log(`\n⬆️  Uploading devi-youth.apk (${sizeMB}) to Vercel Blob Storage…`);

  let blobResult;
  try {
    const fileBuffer = readFileSync(builtApk);
    blobResult = await put('downloads/devi-youth.apk', fileBuffer, {
      access: 'public',
      addRandomSuffix: false,       // keep a stable, predictable filename
      allowOverwrite: true,         // overwrite the previous APK upload
      contentType: 'application/vnd.android.package-archive',
      contentDisposition: 'attachment; filename="devi-youth.apk"',
      // Vercel Blob's CDN caches a public blob's bytes for up to a month
      // by default. Because this upload reuses the exact same URL every
      // time (stable filename + overwrite), without this a re-publish
      // can silently keep serving the PREVIOUS build's bytes. 60s is
      // the minimum allowed TTL.
      cacheControlMaxAge: 60,
      token,
    });
  } catch (err) {
    console.error('❌ Upload to Vercel Blob Storage failed:');
    console.error('   ' + (err && err.message ? err.message : err));
    process.exit(1);
  }

  if (!blobResult || !blobResult.url) {
    console.error('❌ Upload finished but no public URL was returned.');
    process.exit(1);
  }

  const uploadedAt = new Date().toISOString();
  // Belt-and-braces on top of cacheControlMaxAge above: append a
  // version query string so every publish produces a brand-new URL from
  // the browser/CDN cache's point of view, even within the 60s window
  // right after publishing.
  const cacheBustedUrl = (blobResult.downloadUrl || blobResult.url) +
    ((blobResult.downloadUrl || blobResult.url).includes('?') ? '&' : '?') +
    'v=' + encodeURIComponent(pkg.version + '-' + Date.parse(uploadedAt));

  const meta = {
    version: pkg.version,
    size: sizeMB,
    updated,
    downloadUrl: cacheBustedUrl,
    uploadedAt,
  };

  const publicDownloadsDir = path.join(root, 'public/downloads');
  mkdirSync(publicDownloadsDir, { recursive: true });
  writeFileSync(path.join(publicDownloadsDir, 'app-meta.json'), JSON.stringify(meta, null, 2));

  // Also keep a local dated copy for your own sideloading/testing — this
  // one stays on your machine only (releases/ is gitignored), it's never
  // uploaded or committed.
  const outDir = path.join(root, 'releases');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, `devi-youth-v${pkg.version}.apk`), readFileSync(builtApk));

  console.log(`\n✔ Published to Vercel Blob: ${cacheBustedUrl}`);
  console.log(`✔ Local test copy: releases/devi-youth-v${pkg.version}.apk`);
  console.log('\nNext: commit public/downloads/app-meta.json and push — once Vercel');
  console.log('redeploys, the Download button and the in-app nudge banner both');
  console.log('automatically start serving this exact version. The APK itself was');
  console.log('never written to git — only this small pointer file was.');
}

main().catch((err) => {
  console.error('❌ Unexpected error:');
  console.error(err);
  process.exit(1);
});