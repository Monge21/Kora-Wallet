
'use server';

import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const PLAN_DETAILS = {
  BASIC: { name: 'Basic Plan', price: 10.0 },
  GROWTH: { name: 'Growth Plan', price: 25.0 },
  PRO: { name: 'Pro Plan', price: 50.0 },
};

async function getShopData(shopDomain: string) {
  const { firestore } = initializeFirebase();
  const shopsCollection = collection(firestore, 'shops');
  const q = query(shopsCollection, where('domain', '==', shopDomain));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Shop not found.');
  }

  const shopDoc = querySnapshot.docs[0];
  const shopDataObject = shopDoc.data();
  if (!shopDataObject.accessToken) {
    throw new Error('Access token is missing for this shop.');
  }

  return {
    id: shopDoc.id,
    ...shopDataObject,
    accessToken: shopDataObject.accessToken,
    ref: shopDoc.ref,
  };
}

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


export async function createSubscription(plan: 'BASIC' | 'GROWTH' | 'PRO', shopDomain: string) {
  try {
    const shop = await getShopData(shopDomain);
    const planInfo = PLAN_DETAILS[plan];

    const mutation = `
      mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean, $trialDays: Int) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test, trialDays: $trialDays) {
          userErrors {
            field
            message
          }
          appSubscription {
            id
          }
          confirmationUrl
        }
      }
    `;

    const variables = {
      name: planInfo.name,
      returnUrl: `${process.env.NEXT_PUBLIC_HOST}/api/auth/shopify/billing/callback?shop=${shopDomain}&plan=${plan}`,
      test: true, // Use true for development. Change to false for production.
      trialDays: 7,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: planInfo.price, currencyCode: 'USD' },
              interval: 'EVERY_30_DAYS',
            },
          },
        },
      ],
    };

    const data = await shopifyFetch(shop.domain, shop.accessToken, mutation, variables);
    
    if (data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("User errors on subscription creation:", data.appSubscriptionCreate.userErrors);
      throw new Error(data.appSubscriptionCreate.userErrors[0].message);
    }

    return {
      confirmationUrl: data.appSubscriptionCreate.confirmationUrl,
    };
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
