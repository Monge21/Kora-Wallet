
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { optimizeAOV, type OptimizeAOVOutput } from '@/ai/flows/optimize-aov';
import { useToast } from '@/hooks/use-toast';
import { getProducts, type ShopifyProduct } from '@/app/actions/shopify-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Target, CheckCircle, Lightbulb, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PlanGuard } from '@/components/plan-guard';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  salesLastMonth: z.coerce.number().min(0, 'Sales must be non-negative'),
});

const formSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  averageOrderValue: z.coerce.number().min(0, 'AOV must be non-negative'),
  products: z.array(productSchema).min(1, 'At least one product is required'),
});

export default function AovOptimizationPage({ plan, shop }: { plan: 'basic' | 'growth' | 'pro', shop: string }) {
  const [optimization, setOptimization] = useState<OptimizeAOVOutput | null>(null);
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
      storeName: 'My Store',
      averageOrderValue: 0,
      products: [],
    },
  });

   useEffect(() => {
    if (products.length > 0) {
      const productFields = products.slice(0, 3).map(p => ({
        name: p.name,
        price: p.price,
        salesLastMonth: 0, // Placeholder, as we don't have this data yet
      }));
      form.reset({
        storeName: 'My Store',
        averageOrderValue: 0,
        products: productFields,
      });
    }
  }, [products, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setOptimization(null);
    try {
      const result = await optimizeAOV(values);
      setOptimization(result);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Optimization',
        description: e instanceof Error ? e.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PlanGuard userPlan={plan} requiredPlan="pro" shop={shop} featureName="AOV Optimization">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>AOV Optimization</CardTitle>
            <CardDescription>
              Provide your store data to get AI recommendations on how to increase your Average Order Value.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="storeName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="Your Store" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="averageOrderValue" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Current AOV ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Products</h3>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end p-3 border rounded-lg">
                        <FormField name={`products.${index}.name`} control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name={`products.${index}.price`} control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="w-24"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name={`products.${index}.salesLastMonth`} control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Sales</FormLabel><FormControl><Input type="number" {...field} className="w-20" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', price: 0, salesLastMonth: 0 })} className="mt-4">
                    Add Product
                  </Button>
                  {form.formState.errors.products?.message && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.products.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Optimizing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Optimize AOV</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <div className="flex flex-col gap-8">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Actionable insights to boost your AOV will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Finding optimizations...</p>
                </div>
              )}
              {optimization ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" />Recommendations</h3>
                    <ul className="space-y-3">
                      {optimization.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Sparkles className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Expected Impact</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{optimization.expectedImpact}</p>
                  </div>
                </div>
              ) : !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed rounded-lg">
                  <Target className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">Your AOV optimizations will be shown here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlanGuard>
  );
}
