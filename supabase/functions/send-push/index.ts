// supabase/functions/send-push/index.ts
//
// Called by a Supabase Database Webhook whenever a new row is inserted
// into `announcements` or `events`. Fans a push notification out to
// every row in `device_tokens`, using FCM's HTTP v1 API (the legacy
// server-key API this replaced was shut down by Google in 2024, so v1
// — which needs a short-lived OAuth token minted from a Firebase
// service account — is the only option left).
//
// ---------------------------------------------------------------
// One-time setup (see supabase/functions/send-push/README.md too):
//
// 1. Firebase Console -> Project settings -> Service accounts
//    -> "Generate new private key". This downloads a JSON file.
//
// 2. Set these as Supabase Edge Function secrets (never commit them):
//      supabase secrets set FCM_PROJECT_ID=deviyouth
//      supabase secrets set FCM_CLIENT_EMAIL="<client_email from the JSON>"
//      supabase secrets set FCM_PRIVATE_KEY="<private_key from the JSON>"
//      supabase secrets set PUSH_WEBHOOK_SECRET="<any random string you make up>"
//    (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already injected
//    automatically into every Edge Function — no need to set those.)
//
// 3. Deploy:
//      supabase functions deploy send-push --no-verify-jwt
//    (--no-verify-jwt because the caller is a Database Webhook, not a
//    logged-in user with a Supabase JWT; we authenticate the webhook
//    with PUSH_WEBHOOK_SECRET instead, checked below.)
//
// 4. Supabase Dashboard -> Database -> Webhooks -> Create a webhook
//    for INSERT on `announcements` (and a second one for `events`),
//    HTTP POST to this function's URL, with an extra request header:
//      x-webhook-secret: <same PUSH_WEBHOOK_SECRET you set above>
// ---------------------------------------------------------------

import { createClient } from "npm:@supabase/supabase-js@2";

const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") ?? "";
const FCM_CLIENT_EMAIL = Deno.env.get("FCM_CLIENT_EMAIL") ?? "";
const FCM_PRIVATE_KEY = (Deno.env.get("FCM_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const PUSH_WEBHOOK_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------- Build the notification text from the inserted row ----------

function buildNotification(table: string, record: Record<string, unknown>, lang: "en" | "te") {
  const suffix = lang === "te" ? "_te" : "_en";
  if (table === "announcements") {
    return {
      title: String(record[`title${suffix}`] ?? record.title_en ?? "New announcement"),
      body: String(record[`body${suffix}`] ?? record.body_en ?? ""),
    };
  }
  if (table === "events") {
    const prefix = lang === "te" ? "కొత్త ఈవెంట్: " : "New event: ";
    return {
      title: prefix + String(record[`title${suffix}`] ?? record.title_en ?? ""),
      body: String(record[`description${suffix}`] ?? record.description_en ?? ""),
    };
  }
  return { title: String(record.title_en ?? "Devi Youth Updates"), body: "" };
}

// ---------- Mint a short-lived OAuth2 access token for FCM v1 ----------
// (Deno's WebCrypto, no external JWT library needed.)

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: FCM_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const pemBody = FCM_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

// ---------- Send one message via FCM v1 ----------

async function sendToToken(accessToken: string, token: string, title: string, body: string) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: { priority: "high" },
        },
      }),
    },
  );

  if (res.ok) return { token, ok: true };

  const errText = await res.text();
  // A token stops being valid when the app is uninstalled, the user
  // clears data, etc. FCM tells us so — clean those rows out instead
  // of retrying them forever.
  const isGone = res.status === 404 || errText.includes("UNREGISTERED") || errText.includes("NOT_FOUND");
  if (isGone) {
    await supabaseAdmin.from("device_tokens").delete().eq("token", token);
  }
  return { token, ok: false, status: res.status, error: errText };
}

// ---------- HTTP entrypoint ----------

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!PUSH_WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== PUSH_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: { type?: string; table?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { type, table, record } = payload;
  if (type !== "INSERT" || !record || !table) {
    return new Response(JSON.stringify({ skipped: true, reason: "not an insert" }), { status: 200 });
  }

  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from("device_tokens")
    .select("token, lang");

  if (tokensError) {
    return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no registered devices" }), { status: 200 });
  }

  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    return new Response(
      JSON.stringify({ error: "FCM_PROJECT_ID / FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY secrets are not set" }),
      { status: 500 },
    );
  }

  const accessToken = await getAccessToken();

  const results = await Promise.all(
    tokens.map(({ token, lang }) => {
      const { title, body } = buildNotification(table, record, (lang as "en" | "te") ?? "en");
      return sendToToken(accessToken, token, title, body);
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  return new Response(JSON.stringify({ sent, total: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
