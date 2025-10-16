import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';

// Callback para instalar la app en Shopify
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop parameter' }, { status: 400 });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Shopify API credentials are not configured' }, { status: 500 });
  }

  try {
    // Obtener access token desde Shopify
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
    });
    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
    }

    // Inicializar Firebase Admin
    const { firestore } = initializeFirebase();
    const shopsCollection = collection(firestore, 'shops');

    // Verificar si la tienda ya existe
    const q = query(shopsCollection, where('domain', '==', shop));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Obtener información de la tienda desde Shopify
      const shopDetailsResponse = await fetch(`https://${shop}/admin/api/2024-04/shop.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });
      const shopInfo = (await shopDetailsResponse.json()).shop;

      // Crear un nuevo documento en Firestore
      await addDoc(shopsCollection, {
        shopifyStoreId: shopInfo.id,
        name: shopInfo.name,
        domain: shop,
        accessToken,
        createdAt: serverTimestamp(),
        plan: 'basic', // Default plan on install
        chargeId: '',   // Default chargeId on install
      });
    } else {
      // Si ya existe, actualiza el access token y la fecha de actualización
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { 
        accessToken, 
        updatedAt: serverTimestamp(),
        plan: 'basic', // Reset plan on reinstall
        chargeId: '',   // Reset chargeId on reinstall
      });
    }

    // Guardar el shop en una cookie segura para todas las páginas
    (await
      // Guardar el shop en una cookie segura para todas las páginas
      cookies()).set('shop', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Always redirect to the pricing page for new installs and re-installs.
    const redirectUrl = new URL(`/pricing`, process.env.NEXT_PUBLIC_HOST);
    redirectUrl.searchParams.set('shop', shop);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}