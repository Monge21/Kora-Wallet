'use server';

/**
 * @fileOverview AI-powered pricing and discount suggestion flow.
 *
 * - suggestPricingAndDiscounts - A function that provides pricing and discount suggestions.
 * - SuggestPricingAndDiscountsInput - The input type for the suggestPricingAndDiscounts function.
 * - SuggestPricingAndDiscountsOutput - The return type for the suggestPricingAndDiscounts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPricingAndDiscountsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  historicalSalesData: z
    .string()
    .describe(
      'Historical sales data for the product, including dates, prices, and quantities sold.'
    ),
  currentPrice: z.number().describe('The current price of the product.'),
  costPrice: z.number().describe('The cost price of the product.'),
  inventoryLevel: z.number().describe('The current inventory level of the product.'),
  marketTrends: z.string().describe('Current market trends related to the product.'),
});
export type SuggestPricingAndDiscountsInput = z.infer<
  typeof SuggestPricingAndDiscountsInputSchema
>;

const SuggestPricingAndDiscountsOutputSchema = z.object({
  suggestedPrice: z
    .number()
    .describe('The AI-suggested price for the product.'),
  suggestedDiscount: z
    .number()
    .describe('The AI-suggested discount percentage for the product.'),
  reasoning: z
    .string()
    .describe(
      'The AI’s reasoning behind the suggested price and discount, including factors considered.'
    ),
  expectedImpact: z
    .string()
    .describe(
      'The expected impact of the suggested price and discount on sales and profit margins.'
    ),
});
export type SuggestPricingAndDiscountsOutput = z.infer<
  typeof SuggestPricingAndDiscountsOutputSchema
>;

export async function suggestPricingAndDiscounts(
  input: SuggestPricingAndDiscountsInput
): Promise<SuggestPricingAndDiscountsOutput> {
  return suggestPricingAndDiscountsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPricingAndDiscountsPrompt',
  input: {schema: SuggestPricingAndDiscountsInputSchema},
  output: {schema: SuggestPricingAndDiscountsOutputSchema},
  prompt: `You are an AI assistant that helps store owners maximize their profits by suggesting optimal prices and discounts for their products.

  Consider the following information about the product:
  Product Name: {{{productName}}}
  Historical Sales Data: {{{historicalSalesData}}}
  Current Price: {{{currentPrice}}}
  Cost Price: {{{costPrice}}}
  Inventory Level: {{{inventoryLevel}}}
  Market Trends: {{{marketTrends}}}

  Based on this information, suggest a price and discount that will maximize profits.

  In your reasoning, explain the factors you considered, such as sales history, market trends, and inventory levels.
  Also, explain the expected impact of your suggestions on sales and profit margins.

  Output your suggested price, suggested discount, reasoning, and expected impact.`,
});

const suggestPricingAndDiscountsFlow = ai.defineFlow(
  {
    name: 'suggestPricingAndDiscountsFlow',
    inputSchema: SuggestPricingAndDiscountsInputSchema,
    outputSchema: SuggestPricingAndDiscountsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
