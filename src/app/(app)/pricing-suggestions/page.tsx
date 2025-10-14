
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestPricingAndDiscounts, type SuggestPricingAndDiscountsOutput } from '@/ai/flows/suggest-pricing-discounts';
import { useToast } from '@/hooks/use-toast';
import { getProducts, type ShopifyProduct } from '@/app/actions/shopify-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, Percent, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { PlanGuard } from '@/components/plan-guard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  historicalSalesData: z.string().min(1, 'Historical sales data is required'),
  currentPrice: z.coerce.number().min(0, 'Price must be non-negative'),
  costPrice: z.coerce.number().min(0, 'Cost must be non-negative'),
  inventoryLevel: z.coerce.number().min(0, 'Inventory level must be non-negative'),
  marketTrends: z.string().min(1, 'Market trends are required'),
});

export default function PricingSuggestionsPage({ plan, shop }: { plan: 'basic' | 'growth' | 'pro', shop: string }) {
  const [suggestion, setSuggestion] = useState<SuggestPricingAndDiscountsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  useEffect(() => {
    if (shop) {
      getProducts(shop).then(setProducts);
    }
  }, [shop]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      historicalSalesData: 'Sales peak on weekends.',
      currentPrice: 0,
      costPrice: 0,
      inventoryLevel: 0,
      marketTrends: 'Growing interest in single-origin products.',
    },
  });

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue('productName', product.name);
      form.setValue('currentPrice', product.price);
      form.setValue('inventoryLevel', product.inventory);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestPricingAndDiscounts(values);
      setSuggestion(result);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Suggestion',
        description: e instanceof Error ? e.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PlanGuard userPlan={plan} requiredPlan="growth" shop={shop} featureName="Pricing Suggestions">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Pricing & Discount Suggestions</CardTitle>
            <CardDescription>
              Get AI-powered suggestions to optimize pricing and discounts for any product.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                 <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={handleProductChange} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product from your store" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                <FormField name="productName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="Product from your store" {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="currentPrice" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Current Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} disabled /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="costPrice" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Cost Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField name="historicalSalesData" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Historical Sales Data</FormLabel><FormControl><Textarea placeholder="Describe past sales, prices, and seasonality..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="marketTrends" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Market Trends</FormLabel><FormControl><Textarea placeholder="Describe competitor actions, consumer trends, etc." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="inventoryLevel" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Current Inventory Level</FormLabel><FormControl><Input type="number" placeholder="e.g., 500" {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Get Suggestions</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div className="flex flex-col gap-8">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>AI Suggestion</CardTitle>
              <CardDescription>The results of the AI analysis will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating suggestions...</p>
                </div>
              )}
              {suggestion ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><DollarSign className="size-4"/>Suggested Price</p>
                      <p className="text-3xl font-bold text-primary">${suggestion.suggestedPrice.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Percent className="size-4"/>Suggested Discount</p>
                      <p className="text-3xl font-bold text-primary">{suggestion.suggestedDiscount}%</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Reasoning</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.reasoning}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Expected Impact</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.expectedImpact}</p>
                  </div>
                </div>
              ) : !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed rounded-lg">
                  <DollarSign className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">Your pricing suggestions will be shown here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlanGuard>
  );
}
