import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');

  // TODO: Verify the state parameter to prevent CSRF attacks

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop parameter' }, { status: 400 });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Shopify API credentials are not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      console.error('Failed to get access token:', data);
      return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
    }

    const { firestore } = initializeFirebase();
    const shopsCollection = collection(firestore, 'shops');

    // Check if the shop already exists
    const q = query(shopsCollection, where('domain', '==', shop));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Get shop details from Shopify
      const shopDetailsResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });
      const shopDetailsData = await shopDetailsResponse.json();
      const shopInfo = shopDetailsData.shop;

      // Shop doesn't exist, create a new document
      await addDoc(shopsCollection, {
        shopifyStoreId: shopInfo.id,
        name: shopInfo.name,
        domain: shop,
        accessToken,
        createdAt: serverTimestamp(),
      });
    } else {
      // Potentially update the existing document if needed, e.g., new access token
      const docId = querySnapshot.docs[0].id;
      // For simplicity, we are not updating the token here, but you might want to.
    }

    // Redirect to the app's dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/dashboard`);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
