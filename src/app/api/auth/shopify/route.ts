import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter is missing' }, { status: 400 });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Shopify API key is not configured' }, { status: 500 });
  }
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products';
  const redirectUri = `${process.env.NEXT_PUBLIC_HOST}/api/auth/shopify/callback`;
  const state = uuidv4(); // Use a secure, random state

  // TODO: Store the state value to verify it in the callback

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
