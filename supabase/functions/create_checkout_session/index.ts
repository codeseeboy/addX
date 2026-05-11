import { corsHeaders } from '../_shared/cors.ts';

type Input = {
  storeId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function stripeRequest(path: string, params: Record<string, string>) {
  const key = requireEnv('STRIPE_SECRET_KEY');
  const body = new URLSearchParams(params);
  const resp = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Stripe error ${resp.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const input = (await req.json()) as Input;
    const storeId = (input.storeId ?? '').trim();
    const priceId = (input.priceId ?? '').trim();
    if (!storeId) return json(400, { error: 'storeId is required' });
    if (!priceId) return json(400, { error: 'priceId is required' });
    if (!input.successUrl) return json(400, { error: 'successUrl is required' });
    if (!input.cancelUrl) return json(400, { error: 'cancelUrl is required' });

    const session = await stripeRequest('checkout/sessions', {
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: storeId,
      'metadata[store_id]': storeId,
    });

    return json(200, { url: session.url, id: session.id });
  } catch (e) {
    return json(500, { error: (e as Error).message || 'Unknown error' });
  }
});

