'use server';
/**
 * @fileOverview Predicts sales per product using AI to optimize inventory and marketing strategies.
 *
 * - predictSales - A function that predicts sales for a given product.
 * - PredictSalesInput - The input type for the predictSales function.
 * - PredictSalesOutput - The return type for the predictSales function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictSalesInputSchema = z.object({
  productName: z.string().describe('The name of the product to predict sales for.'),
  historicalSalesData: z.string().describe('Historical sales data for the product, as a string.'),
  marketTrends: z.string().describe('Current market trends related to the product.'),
  inventoryLevel: z.number().describe('The current inventory level of the product.'),
});
export type PredictSalesInput = z.infer<typeof PredictSalesInputSchema>;

const PredictSalesOutputSchema = z.object({
  predictedSales: z.number().describe('The predicted sales for the product.'),
  confidenceLevel: z.number().describe('The confidence level of the prediction (0-1).'),
  explanation: z.string().describe('An explanation of the factors influencing the prediction.'),
});
export type PredictSalesOutput = z.infer<typeof PredictSalesOutputSchema>;

export async function predictSales(input: PredictSalesInput): Promise<PredictSalesOutput> {
  return predictSalesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictSalesPrompt',
  input: {schema: PredictSalesInputSchema},
  output: {schema: PredictSalesOutputSchema},
  prompt: `You are an AI sales prediction expert. Analyze the provided data to predict sales for the given product.

Product Name: {{{productName}}}
Historical Sales Data: {{{historicalSalesData}}}
Market Trends: {{{marketTrends}}}
Current Inventory Level: {{{inventoryLevel}}}

Consider all factors to provide an accurate sales prediction, a confidence level (0-1), and a clear explanation of your reasoning.`,
});

const predictSalesFlow = ai.defineFlow(
  {
    name: 'predictSalesFlow',
    inputSchema: PredictSalesInputSchema,
    outputSchema: PredictSalesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
