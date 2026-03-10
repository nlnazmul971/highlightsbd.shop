export function verifyApiSecret(authHeader: string | null): { authorized: boolean; error?: string } {
  const API_SECRET = process.env.API_SECRET_KEY;

  if (!API_SECRET) {
    // If no secret is configured, allow all requests (development mode)
    return { authorized: true };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== API_SECRET) {
    return { authorized: false, error: 'Invalid API key' };
  }

  return { authorized: true };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}
