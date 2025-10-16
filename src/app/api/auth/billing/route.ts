import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';

async function shopifyFetch(shopDomain: string, accessToken: string, query: string, variables: Record<string, any> = {}) {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
        console.error('Shopify API Errors:', JSON.stringify(result.errors, null, 2));
        throw new Error(`Shopify API call failed: ${result.errors[0].message}`);
    }

    return result.data;
}

const ACTIVATE_SUBSCRIPTION_MUTATION = `
  mutation AppSubscriptionActivate($id: ID!) {
    appSubscriptionActivate(id: $id) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
    }
  }
`;


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chargeId = searchParams.get('charge_id');
  const shopDomain = searchParams.get('shop');
  const plan = searchParams.get('plan');

  if (!chargeId || !shopDomain || !plan) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/pricing?error=Invalid+callback+parameters`);
  }

  try {
    const { firestore } = initializeFirebase();
    const shopsCollection = collection(firestore, 'shops');
    const q = query(shopsCollection, where('domain', '==', shopDomain));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Shop not found in database.');
    }

    const shopDocRef = querySnapshot.docs[0].ref;
    const shopDoc = await getDoc(shopDocRef);
    const shopData = shopDoc.data();

    if (!shopData || !shopData.accessToken) {
        throw new Error('Shop data or access token is missing.');
    }

    // This is the App Subscription ID from Shopify, e.g. "gid://shopify/AppSubscription/12345"
    const subscriptionGid = `gid://shopify/AppSubscription/${chargeId}`;

    // Activate the subscription with Shopify
    const activationData = await shopifyFetch(
        shopDomain, 
        shopData.accessToken, 
        ACTIVATE_SUBSCRIPTION_MUTATION, 
        { id: subscriptionGid }
    );
    
    const activatedSubscription = activationData.appSubscriptionActivate.appSubscription;
    const userErrors = activationData.appSubscriptionActivate.userErrors;

    if (userErrors.length > 0) {
        throw new Error(`Error activating subscription: ${userErrors[0].message}`);
    }

    if (activatedSubscription && activatedSubscription.status === 'ACTIVE') {
        // Update Firestore with the new plan and charge ID
        await updateDoc(shopDocRef, {
            plan: plan.toLowerCase(),
            chargeId: chargeId,
        });

        // Redirect to the dashboard on successful activation
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/dashboard`);
    } else {
        throw new Error('Subscription could not be activated.');
    }

  } catch (error) {
    console.error('Billing callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/pricing?error=${encodeURIComponent(errorMessage)}`);
  }
}

