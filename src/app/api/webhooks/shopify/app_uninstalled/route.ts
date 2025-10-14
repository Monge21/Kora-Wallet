
import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const shopDomain = request.headers.get('x-shopify-shop-domain');
  const body = await request.text();

  if (!hmac || !shopDomain || !body) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Verify the webhook came from Shopify
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Shopify webhook secret is not configured.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  const generatedHmac = Buffer.from(hash);
  const receivedHmac = Buffer.from(hmac);

  if (!crypto.timingSafeEqual(generatedHmac, receivedHmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Webhook is verified, proceed with logic
  try {
    console.log(`App uninstalled for ${shopDomain}. Cleaning up data.`);
    const { firestore } = initializeFirebase();
    const shopsCollection = collection(firestore, 'shops');
    const q = query(shopsCollection, where('domain', '==', shopDomain));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const shopDocRef = querySnapshot.docs[0].ref;
      await deleteDoc(shopDocRef);
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
