'use server';

import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const PLAN_DETAILS = {
  BASIC: { name: 'Basic Plan', monthlyPrice: 10.0, annualPrice: 96.0 },
  GROWTH: { name: 'Growth Plan', monthlyPrice: 25.0, annualPrice: 240.0 },
  PRO: { name: 'Pro Plan', monthlyPrice: 50.0, annualPrice: 480.0 },
};

type BillingInterval = 'EVERY_30_DAYS' | 'ANNUAL';

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
    
    if (result.data?.userErrors?.length) {
        console.error('Shopify API User Errors:', JSON.stringify(result.data.userErrors, null, 2));
        throw new Error(result.data.userErrors[0].message);
    }
    
    if (result.data?.appSubscriptionCreate?.userErrors?.length) {
        console.error('Shopify API User Errors:', JSON.stringify(result.data.appSubscriptionCreate.userErrors, null, 2));
        throw new Error(result.data.appSubscriptionCreate.userErrors[0].message);
    }


    return result.data;
}


export async function createSubscription(plan: 'BASIC' | 'GROWTH' | 'PRO', shopDomain: string, interval: BillingInterval) {
  try {
    const shop = await getShopData(shopDomain);
    const planInfo = PLAN_DETAILS[plan];
    const isAnnual = interval === 'ANNUAL';

    const price = isAnnual ? planInfo.annualPrice : planInfo.monthlyPrice;
    const planName = `${planInfo.name} (${isAnnual ? 'Annual' : 'Monthly'})`;

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
    
    // The return URL needs to include the shop domain to handle the callback correctly
    const returnUrl = `${process.env.NEXT_PUBLIC_HOST}/api/auth/shopify/billing/callback?shop=${shopDomain}&plan=${plan.toLowerCase()}`;

    const variables = {
      name: planName,
      returnUrl: returnUrl,
      test: process.env.NODE_ENV !== 'production', // Use test mode in development
      trialDays: 7,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: price, currencyCode: 'USD' },
              interval: interval,
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