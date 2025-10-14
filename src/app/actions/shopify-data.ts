'use server';

import { initializeFirebase } from '@/firebase/server';

type ShopData = {
  id: string;
  accessToken: string;
  domain: string;
  ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
  [key: string]: any;
};

async function getShopData(shopDomain: string): Promise<ShopData> {
  const { firestore } = initializeFirebase();
  const shopsCollection = firestore.collection('shops');
  const querySnapshot = await shopsCollection.where('domain', '==', shopDomain).get();

  if (querySnapshot.empty) {
    throw new Error(`Shop not found for domain: ${shopDomain}`);
  }

  const shopDoc = querySnapshot.docs[0];
  const shopData = shopDoc.data();

  if (!shopData.accessToken) {
    throw new Error('Access token not found for this shop.');
  }
  
  return {
    id: shopDoc.id,
    accessToken: shopData.accessToken,
    domain: shopData.domain,
    ...shopData,
    ref: shopDoc.ref,
  };
}

async function shopifyFetch(shopDomain: string, query: string, variables: Record<string, any> = {}) {
    const shop = await getShopData(shopDomain);
    const response = await fetch(`https://${shop.domain}/admin/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shop.accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
        console.error('Shopify API Errors:', JSON.stringify(result.errors, null, 2));
        throw new Error(`Shopify API call failed: ${result.errors[0].message}`);
    }
    
    if (result.data.userErrors?.length > 0) {
       console.error('Shopify API User Errors:', JSON.stringify(result.data.userErrors, null, 2));
       throw new Error(`Shopify API call failed: ${result.data.userErrors[0].message}`);
    }


    return result.data;
}

const GET_DASHBOARD_DATA_QUERY = `
query getDashboardData($ordersQuery: String) {
  orders(first: 5, sortKey: PROCESSED_AT, reverse: true, query: $ordersQuery) {
    edges {
      node {
        id
        name
        fullyPaid
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          firstName
          lastName
          email
        }
      }
    }
  }
  shop {
    currencyFormats {
      moneyFormat
    }
    analytics {
      totalSales(last: 30) {
        amount
        currencyCode
      }
      totalOrders(last: 30)
      averageOrderValue(last: 30) {
        amount
        currencyCode
      }
    }
  }
}
`;

export type ShopifyDashboardData = {
  totalSales: { amount: string; currencyCode: string };
  totalOrders: number;
  averageOrderValue: { amount: string; currencyCode: string };
  recentSales: {
    id: string;
    name: string;
    email: string;
    amount: string;
    currencyCode: string;
    avatar: string;
  }[];
};

export async function getDashboardData(shopDomain: string): Promise<ShopifyDashboardData | null> {
    try {
        const response = await shopifyFetch(shopDomain, GET_DASHBOARD_DATA_QUERY, {
            "ordersQuery": "financial_status:paid"
        });

        const shopAnalytics = response.shop.analytics;

        return {
            totalSales: shopAnalytics.totalSales[0],
            totalOrders: shopAnalytics.totalOrders,
            averageOrderValue: shopAnalytics.averageOrderValue,
            recentSales: response.orders.edges.map((edge: any, index: number) => ({
                id: edge.node.id,
                name: `${edge.node.customer?.firstName || ''} ${edge.node.customer?.lastName || ''}`.trim(),
                email: edge.node.customer?.email || 'No email',
                amount: edge.node.totalPriceSet.shopMoney.amount,
                currencyCode: edge.node.totalPriceSet.shopMoney.currencyCode,
                avatar: `https://picsum.photos/seed/${index + 2}/40/40`,
            })),
        };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return null;
    }
}


const GET_PRODUCTS_QUERY = `
query getProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        variants(first: 1) {
          edges {
            node {
              price
            }
          }
        }
        totalInventory
      }
    }
  }
}
`;

export type ShopifyProduct = {
  id: string;
  name: string;
  price: number;
  inventory: number;
};

export async function getProducts(shopDomain: string, count: number = 20): Promise<ShopifyProduct[]> {
  try {
    const response = await shopifyFetch(shopDomain, GET_PRODUCTS_QUERY, { "first": count });
    return response.products.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.title,
      price: parseFloat(edge.node.variants.edges[0]?.node.price || '0'),
      inventory: edge.node.totalInventory || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}


const GET_DISCOUNT_CODES_QUERY = `
query getDiscountCodes($first: Int) {
  codeDiscountNodes(first: $first) {
    edges {
      node {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
            asyncUsageCount
          }
        }
      }
    }
  }
}
`;

export type ShopifyDiscount = {
  id: string;
  code: string;
  title: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED';
  usageCount: number;
};


export async function getDiscountCodes(shopDomain: string, count: number = 20): Promise<ShopifyDiscount[]> {
  try {
    const response = await shopifyFetch(shopDomain, GET_DISCOUNT_CODES_QUERY, { "first": count });
    
    return response.codeDiscountNodes.edges.map((edge: any) => {
        const discountNode = edge.node;
        const codeDiscount = discountNode.codeDiscount;
        // The discount code is part of the ID in the format 'gid://shopify/DiscountCodeNode/12345'
        // and the actual title is what the user sees. We use title for both code and title for simplicity here.
        return {
            id: discountNode.id,
            code: codeDiscount.title,
            title: codeDiscount.title,
            status: codeDiscount.status,
            usageCount: codeDiscount.asyncUsageCount,
        }
    });

  } catch (error) {
    console.error("Failed to fetch discount codes:", error);
    return [];
  }
}

const CREATE_BASIC_DISCOUNT_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        codeDiscount {
          ... on DiscountCodeBasic {
            title
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type CreateDiscountInput = {
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
};

export async function createDiscountCode(shopDomain: string, discount: CreateDiscountInput): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const shopData = await getShopData(shopDomain);

    let customerGets;
    if (discount.type === 'PERCENTAGE') {
        if (discount.value <= 0 || discount.value > 100) {
            throw new Error('Percentage value must be between 0 and 100.');
        }
        customerGets = {
            value: { percentage: discount.value / 100 },
            items: { all: true }
        };
    } else { // FIXED_AMOUNT
        customerGets = {
            value: { 
                discountAmount: { 
                    amount: discount.value.toFixed(2), // API requires amount as a string
                    // This is a simplification. A robust implementation would fetch the shop's currency.
                    currencyCode: 'USD' 
                } 
            },
            items: { all: true }
        };
    }

    const variables = {
        basicCodeDiscount: {
            title: discount.code,
            code: discount.code,
            startsAt: new Date().toISOString(),
            customerSelection: { all: true },
            customerGets: customerGets,
            appliesOncePerCustomer: true,
        },
    };

    const data = await shopifyFetch(shopDomain, CREATE_BASIC_DISCOUNT_MUTATION, variables);
    
    const createdDiscount = data.discountCodeBasicCreate;

    if (createdDiscount.userErrors && createdDiscount.userErrors.length > 0) {
      throw new Error(createdDiscount.userErrors[0].message);
    }

    const createdCode = createdDiscount.codeDiscountNode?.codeDiscount.title;

    return { success: true, code: createdCode };

  } catch (error) {
    console.error('Failed to create discount code:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}
