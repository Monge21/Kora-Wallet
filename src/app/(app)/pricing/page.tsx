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
import { Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createSubscription } from '@/app/actions/shopify';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type PlanName = 'Basic' | 'Growth' | 'Pro';
type BillingInterval = 'MONTHLY' | 'ANNUAL';

const plans = [
  {
    name: 'Basic',
    badge: 'BASIC',
    monthlyPrice: 10,
    description: 'Essential features to get started.',
    features: [
      'Dashboard with key metrics',
      'Discount code management',
      'Basic AI analytics',
    ],
    cta: 'Select plan',
    highlighted: false,
  },
  {
    name: 'Growth',
    badge: 'GROWTH',
    monthlyPrice: 25,
    description: 'For growing businesses.',
    features: [
      'Everything in Basic',
      'Sales Prediction AI',
      'Pricing Suggestion AI',
    ],
    cta: 'Select plan',
    highlighted: true,
  },
  {
    name: 'Pro',
    badge: 'PRO',
    monthlyPrice: 50,
    annualPrice: 480, // (50 * 12 * 0.8) = 480, 20% saving
    description: 'Advanced AI and analytics.',
    features: [
        'Everything in Growth',
        'AOV Optimization AI',
        'Advanced analytics',
    ],
    cta: 'Select plan',
    highlighted: false,
  },
];

export default function PricingPage({ shop, plan: currentPlan }: { shop: string, plan: 'basic' | 'growth' | 'pro' }) {
  const [isLoading, setIsLoading] = useState<PlanName | null>(null);
  const [proBillingInterval, setProBillingInterval] = useState<BillingInterval>('MONTHLY');
  const { toast } = useToast();

  const handlePlanSelection = async (planName: PlanName, interval: BillingInterval) => {
    if (!shop) {
      toast({
        variant: 'destructive',
        title: 'Shop not found',
        description: 'The shop domain is missing. Please try reinstalling the app.',
      });
      return;
    }
    
    let planId: 'BASIC' | 'GROWTH' | 'PRO';
    switch (planName) {
        case 'Basic':
            planId = 'BASIC';
            break;
        case 'Growth':
            planId = 'GROWTH';
            break;
        case 'Pro':
            planId = 'PRO';
            break;
        default:
            return;
    }

    setIsLoading(planName);
    try {
      const planInterval = interval === 'ANNUAL' ? 'ANNUAL' : 'EVERY_30_DAYS';
      const response = await createSubscription(planId, shop, planInterval);
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
  
  const userIsOnPlan = (planName: PlanName) => {
    if (!currentPlan) return false;
    return currentPlan.toLowerCase() === planName.toLowerCase();
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full">
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn('flex flex-col border-2', {
              'border-primary/50': plan.highlighted,
              'border-border': !plan.highlighted,
            })}
          >
            <CardHeader className="items-start space-y-4">
              <Badge variant={plan.highlighted ? 'default' : 'secondary'} className={cn({'bg-blue-600 text-white': plan.name === 'Growth'})}>{plan.badge}</Badge>
              
              {plan.name === 'Pro' ? (
                 <RadioGroup value={proBillingInterval} onValueChange={(val) => setProBillingInterval(val as BillingInterval)} className="h-[72px] space-y-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MONTHLY" id="pro-monthly" />
                        <Label htmlFor="pro-monthly" className="flex items-baseline gap-1 text-sm">
                            USD <span className="text-xl font-bold text-foreground">${plan.monthlyPrice}</span>/month
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ANNUAL" id="pro-annual" />
                        <Label htmlFor="pro-annual" className="flex items-baseline gap-1 text-sm">
                             USD <span className="text-xl font-bold text-foreground">${plan.annualPrice}</span>/year <span className="text-green-600 font-semibold">(save 20%)</span>
                        </Label>
                    </div>
                </RadioGroup>
              ) : (
                 <div className="h-[72px]">
                  <p className="text-sm text-muted-foreground">USD <span className="text-3xl font-bold text-foreground">${plan.monthlyPrice}</span>/month</p>
                  <p className="text-blue-500 text-sm mt-2">{plan.description}</p>
                </div>
              )}
            </CardHeader>
            <CardFooter className="pb-4">
               <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : (userIsOnPlan(plan.name as PlanName) ? 'outline' : 'secondary')}
                onClick={() => {
                  if (plan.name === 'Pro') handlePlanSelection(plan.name as PlanName, proBillingInterval)
                  else handlePlanSelection(plan.name as PlanName, 'MONTHLY')
                }}
                disabled={isLoading === plan.name || userIsOnPlan(plan.name as PlanName)}
              >
                {isLoading === plan.name ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                ) : (
                  userIsOnPlan(plan.name as PlanName) ? 'Your current plan' : plan.cta
                )}
              </Button>
            </CardFooter>
            <CardContent className="flex-1 space-y-2 pt-4 border-t">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
