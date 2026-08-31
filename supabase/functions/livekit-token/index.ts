// Supabase Edge Function: mints a short-lived LiveKit access token
// server-side, so the LiveKit API secret never reaches the browser.
// Plain Web Crypto HMAC-SHA256 JWT signing — no extra npm dependency.
//
// Deploy once:
//   supabase functions deploy livekit-token
// Then set the two secrets once (from your LiveKit Cloud project settings):
//   supabase secrets set LIVEKIT_API_KEY=xxxx LIVEKIT_API_SECRET=xxxx

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlJson(obj) {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)));
}

async function signToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${base64urlJson(header)}.${base64urlJson(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64url(sig)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const { room, identity, name, canPublish } = await req.json();
    if (!room || !identity) throw new Error('room and identity are required');

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    if (!apiKey || !apiSecret) throw new Error('LiveKit is not configured on the server yet — set LIVEKIT_API_KEY/LIVEKIT_API_SECRET.');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      exp: now + 60 * 60 * 4,
      iss: apiKey,
      nbf: now - 10,
      sub: identity,
      name: name || identity,
      video: {
        room,
        roomJoin: true,
        canPublish: Boolean(canPublish),
        canSubscribe: true,
        canPublishData: true,
      },
    };
    const token = await signToken(payload, apiSecret);
    return new Response(JSON.stringify({ token }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
