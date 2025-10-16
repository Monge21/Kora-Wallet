'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import Link from 'next/link';

type Plan = 'basic' | 'growth' | 'pro';

interface PlanGuardProps {
  userPlan: Plan;
  requiredPlan: Plan;
  shop: string;
  children: React.ReactNode;
  featureName: string;
}

const planHierarchy: Record<Plan, number> = {
  basic: 1,
  growth: 2,
  pro: 3,
};

export function PlanGuard({ userPlan, requiredPlan, shop, children, featureName }: PlanGuardProps) {
  const currentPlan = userPlan || 'basic';
  const userLevel = planHierarchy[currentPlan];
  const requiredLevel = planHierarchy[requiredPlan];

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="text-primary" />
            Upgrade to Unlock
          </CardTitle>
          <CardDescription>
            The &quot;{featureName}&quot; feature requires the &quot;{requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}&quot; plan or higher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are currently on the &quot;{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}&quot; plan. Please upgrade your plan to access this feature.
          </p>
          <Button asChild>
            <Link href={`/pricing?shop=${shop}`}>View Plans & Upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
