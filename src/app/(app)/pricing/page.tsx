'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Star, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createSubscription } from '@/app/actions/shopify';
import { useToast } from '@/hooks/use-toast';

type Plan = 'Basic' | 'Growth' | 'Pro';

const plans = [
  {
    name: 'Basic',
    price: '$10',
    priceFrequency: '/month',
    description: 'Essential financial analysis and promotional tools to get you started.',
    features: [
      'Financial analysis',
      '1 type of automatic promotion',
    ],
    cta: 'Choose Basic',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$25',
    priceFrequency: '/month',
    description: 'Advanced analytics and automation to accelerate your growth.',
    features: [
      'Advanced financial analysis',
      'Sales forecasting',
      'Discount automation',
    ],
    cta: 'Choose Growth',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$50',
    priceFrequency: '/month',
    description: 'The complete suite for scaling your business with intelligent insights.',
    features: [
      'All Growth features',
      'Multichannel integration',
      'Smart alerts',
      'Priority support',
    ],
    cta: 'Choose Pro',
    highlighted: false,
  },
];

export default function PricingPage({ shop }: { shop: string }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('Growth');
  const [isLoading, setIsLoading] = useState<Plan | null>(null);
  const { toast } = useToast();

  const handlePlanSelection = async (planName: Plan) => {
    if (!shop) {
      toast({
        variant: 'destructive',
        title: 'Shop not found',
        description: 'The shop domain is missing. Please try reinstalling the app.',
      });
      return;
    }

    setIsLoading(planName);
    try {
      const response = await createSubscription(planName.toUpperCase() as 'BASIC' | 'GROWTH' | 'PRO', shop);
      if (response.confirmationUrl) {
        // Redirect the user to Shopify to confirm the subscription
        window.top!.location.href = response.confirmationUrl;
      } else {
        throw new Error(response.error || 'Failed to create subscription.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Find the perfect plan</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Start for free and scale as you grow. All plans include a 7-day free trial.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn('flex flex-col', {
              'border-primary ring-2 ring-primary': plan.highlighted,
            })}
          >
            <CardHeader className="items-center">
              {plan.highlighted && (
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Star className="h-5 w-5" />
                  Most Popular
                </div>
              )}
              <CardTitle className="text-2xl mt-2">{plan.name}</CardTitle>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.priceFrequency}</span>
              </div>
              <CardDescription className="text-center h-10">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                onClick={() => handlePlanSelection(plan.name as Plan)}
                disabled={isLoading === plan.name}
              >
                {isLoading === plan.name ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                ) : (
                  plan.cta
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
