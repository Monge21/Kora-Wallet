import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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

    // ⚡ Usamos la línea de import que pediste, pero con Admin SDK
    const shopsCollection = firestore.collection('shops');

    // Verificar si la tienda ya existe
    const q = shopsCollection.where('domain', '==', shop);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      // Obtener información de la tienda desde Shopify
      const shopDetailsResponse = await fetch(`https://${shop}/admin/api/2025-10/shop.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });
      const shopInfo = (await shopDetailsResponse.json()).shop;

      // Crear un nuevo documento en Firestore
      await shopsCollection.add({
        shopifyStoreId: shopInfo.id,
        name: shopInfo.name,
        domain: shop,
        accessToken,
        createdAt: serverTimestamp(),
      });
    } else {
      // Si ya existe, puedes actualizar el access token si quieres
      const docId = querySnapshot.docs[0].id;
      // Ejemplo de actualización:
      // await shopsCollection.doc(docId).update({ accessToken, updatedAt: serverTimestamp() });
    }

    // Guardar el shop en una cookie segura para todas las páginas
    (await cookies()).set('shop', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Redirigir al dashboard
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_HOST}/dashboard`);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
