import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { verifyShopifyHmac } from '@/lib/shopify-hmac';

export async function POST(request: NextRequest) {
  const shopDomain = request.headers.get('x-shopify-shop-domain');
  
  // Get raw body as a string for HMAC validation
  const rawBody = await request.text();

  if (!shopDomain) {
    return NextResponse.json({ error: 'Missing x-shopify-shop-domain header' }, { status: 400 });
  }

  // Verify the webhook came from Shopify
  try {
    await verifyShopifyHmac(request.headers, rawBody);
  } catch (error) {
    if (error instanceof Error) {
        console.error('Webhook HMAC validation failed:', error.message);
        return NextResponse.json({ error: 'Unauthorized: ' + error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Webhook is verified, proceed with logic
  try {
    console.log(`App uninstalled for ${shopDomain}. Cleaning up data.`);
    const { firestore } = initializeFirebase();
    const shopsCollection = firestore.collection('shops');
    const q = shopsCollection.where('domain', '==', shopDomain);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      const shopDocRef = querySnapshot.docs[0].ref;
      await shopDocRef.delete();
      console.log(`Successfully deleted data for shop: ${shopDomain}`);
    } else {
      console.warn(`Received uninstall webhook for a shop not found in the database: ${shopDomain}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to process app_uninstalled webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

