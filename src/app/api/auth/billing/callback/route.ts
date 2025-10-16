import { NextResponse, type NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase/server';

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

const CHECK_SUBSCRIPTION_QUERY = `
  query appSubscription($id: ID!) {
    node(id: $id) {
      ... on AppSubscription {
        id
        status
        name
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
    const shopsCollection = firestore.collection('shops');
    const q = shopsCollection.where('domain', '==', shopDomain);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      throw new Error('Shop not found in database.');
    }

    const shopDocRef = querySnapshot.docs[0].ref;
    const shopDoc = await shopDocRef.get();
    const shopData = shopDoc.data();

    if (!shopData || !shopData.accessToken) {
        throw new Error('Shop data or access token is missing.');
    }

    // This is the App Subscription ID from Shopify, e.g. "gid://shopify/AppSubscription/12345"
    const subscriptionGid = `gid://shopify/AppSubscription/${chargeId}`;

    // **CRITICAL STEP**: Verify the subscription is active with Shopify
    const verificationData = await shopifyFetch(
        shopDomain,
        shopData.accessToken,
        CHECK_SUBSCRIPTION_QUERY,
        { id: subscriptionGid }
    );
    
    const subscriptionNode = verificationData.node;

    if (subscriptionNode && subscriptionNode.status === 'ACTIVE') {
        // Subscription is confirmed active. Update Firestore.
        await shopDocRef.update({
            plan: plan.toLowerCase(),
            chargeId: chargeId,
            // You can also store the GID for future reference
            subscriptionGid: subscriptionGid,
        });

        // Redirect to the dashboard on successful activation
        // Add a query param to show a success message if desired
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/dashboard?billing_success=true`);
    } else {
        // This can happen if the user declines, or if there's an issue.
        // The subscription might not be active, or it might already be active from a previous attempt.
        // It's safest to send them back to pricing with an informational error.
        console.warn('Subscription status was not ACTIVE after confirmation:', subscriptionNode?.status);
        throw new Error(`Subscription could not be confirmed. Status: ${subscriptionNode?.status || 'UNKNOWN'}`);
    }

  } catch (error) {
    console.error('Billing callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_HOST}/pricing?error=${encodeURIComponent(errorMessage)}`);
  }
}



