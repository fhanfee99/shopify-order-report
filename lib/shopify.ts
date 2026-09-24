export async function shopifyFetch<T = any>({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, any>;
}): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'farhandev3.myshopify.com';
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "SHOPIFY_ADMIN_ACCESS_TOKEN missing in .env.local. Add 'shpat_...' token."
    );
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const endpoint = `https://${cleanDomain}/admin/api/2024-01/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const responseText = await response.text();
  let json: any;

  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Shopify API HTTP ${response.status}: Invalid JSON response received.`
    );
  }

  if (json.errors) {
    const errMsg =
      typeof json.errors === 'string'
        ? json.errors
        : json.errors[0]?.message || JSON.stringify(json.errors);
    throw new Error(`Shopify GraphQL Error: ${errMsg}`);
  }

  return json.data;
}

// Default export fallback to satisfy both named and default imports
export default shopifyFetch;
