'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';

export default function InstallPage() {
  const [shop, setShop] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shop) {
      window.location.href = `/api/auth/shopify?shop=${shop}`;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Install Kora Wallet</CardTitle>
          <CardDescription>
            Enter your Shopify store domain to begin the installation.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="shop">Store Domain</Label>
              <Input
                id="shop"
                name="shop"
                type="text"
                placeholder="your-store.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Example: your-store.myshopify.com
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Install App
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
