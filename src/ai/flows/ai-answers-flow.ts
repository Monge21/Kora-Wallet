'use server';
/**
 * @fileOverview An AI flow to answer user questions about the Kora Wallet app.
 *
 * - aiAnswers - A function that answers user questions.
 * - AIAnswersInput - The input type for the aiAnswers function.
 * - AIAnswersOutput - The return type for the aiAnswers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAnswersInputSchema = z.object({
  question: z.string().describe('The user\'s question about the Kora Wallet app.'),
});
export type AIAnswersInput = z.infer<typeof AIAnswersInputSchema>;

const AIAnswersOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type AIAnswersOutput = z.infer<typeof AIAnswersOutputSchema>;

export async function aiAnswers(input: AIAnswersInput): Promise<AIAnswersOutput> {
  return aiAnswersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAnswersPrompt',
  input: {schema: AIAnswersInputSchema},
  output: {schema: AIAnswersOutputSchema},
  prompt: `You are an expert on the Kora Wallet application. Your goal is to provide helpful and concise answers to user questions.

  Question: {{{question}}}
  
  Based on your knowledge of the Kora Wallet app, provide a clear and accurate answer.
  Kora Wallet is a Shopify app that provides AI-powered analytics and tools for e-commerce stores.
  - It has a dashboard with key metrics.
  - It allows creating and managing discounts.
  - It has AI tools to predict sales, suggest pricing, and optimize Average Order Value (AOV).
  - There are three subscription plans: Basic, Growth, and Pro, each unlocking more features.
  
  Answer the question based on this context.`,
});

const aiAnswersFlow = ai.defineFlow(
  {
    name: 'aiAnswersFlow',
    inputSchema: AIAnswersInputSchema,
    outputSchema: AIAnswersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
