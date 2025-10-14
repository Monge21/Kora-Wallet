
import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chargeId = searchParams.get('charge_id');
  const shopDomain = searchParams.get('shop');
  const plan = searchParams.get('plan');

  if (!chargeId || !shopDomain || !plan) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/pricing?error=Invalid+callback`);
  }

  try {
    const { firestore } = initializeFirebase();
    const shopsCollection = collection(firestore, 'shops');
    const q = query(shopsCollection, where('domain', '==', shopDomain));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Shop not found.');
    }

    const shopDocRef = querySnapshot.docs[0].ref;

    // Here you would typically activate the subscription in Shopify API
    // For this example, we'll just update our database record
    
    await updateDoc(shopDocRef, {
      plan: plan.toLowerCase(),
      chargeId: chargeId,
    });

    // Redirect to the dashboard on successful activation
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/dashboard`);

  } catch (error) {
    console.error('Billing callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/pricing?error=${encodeURIComponent(errorMessage)}`);
  }
}
