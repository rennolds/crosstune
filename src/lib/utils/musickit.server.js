import { env } from '$env/dynamic/private';

let cachedToken = null;
let cachedTokenExpiry = 0;

export async function generateMusicKitToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedTokenExpiry - 300) {
    return cachedToken;
  }

  const teamId = env.MUSICKIT_TEAM_ID;
  const keyId = env.MUSICKIT_KEY_ID;
  const privateKeyBase64 = env.MUSICKIT_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKeyBase64) {
    throw new Error('Missing MusicKit environment variables');
  }

  const pem = atob(privateKeyBase64);
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const derBytes = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    derBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const toBase64Url = (obj) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = now + 15777000;
  const header = toBase64Url({ alg: 'ES256', kid: keyId });
  const payload = toBase64Url({ iss: teamId, iat: now, exp });
  const signingInput = `${header}.${payload}`;

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  cachedToken = `${signingInput}.${sig}`;
  cachedTokenExpiry = exp;
  return cachedToken;
}
