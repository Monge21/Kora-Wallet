import type { Metadata } from 'next';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import React from 'react';
import { redirect } from 'next/navigation';
import { Chatbot } from '@/components/chatbot';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Kora Wallet',
  description: 'AI-powered analytics and tools for your Shopify store.',
};

// Turn off DEV_MODE to enable Shopify authentication.
const DEV_MODE = true;
const DEV_SHOP_DOMAIN = 'dev-store.myshopify.com';

// In DEV_MODE, we can simulate different plans. In production, this comes from the database.
const DEV_PLAN: 'basic' | 'growth' | 'pro' = 'pro'; 

// This function simulates checking if a shop is newly installed.
// In a real app, this would check a flag in your database.
async function isNewInstall(shopDomain: string): Promise<boolean> {
  if (DEV_MODE) {
    // In dev mode, you can toggle this to test both flows.
    // Set to `true` to simulate a new user being sent to /pricing.
    // Set to `false` to simulate an existing user being sent to their content.
    return false; 
  }
  // Production logic would check a 'firstLogin' flag or similar in Firestore.
  // For now, we assume reinstalling users are treated as new.
  return true;
}


// Server-side function to get shop plan
async function getShopPlan(shopDomain: string | undefined): Promise<'basic' | 'growth' | 'pro'> {
  if (DEV_MODE) return DEV_PLAN;
  if (!shopDomain) return 'basic'; // Default plan
  // In production, this would fetch the plan from Firestore.
  // This is a placeholder for that logic.
  return 'basic'; 
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  
  let shopDomain: string | undefined;

  if (DEV_MODE) {
    shopDomain = DEV_SHOP_DOMAIN;
  } else {
    const cookieStore = await cookies();
    shopDomain = cookieStore.get('shop')?.value;
    if (!shopDomain) {
      // In production, if there is no shop cookie, the user is unauthenticated.
      // Redirect them to the main installation entry point.
      // This URL would be provided by you in the Shopify Partner Dashboard.
      redirect(process.env.SHOPIFY_APP_URL || '/');
    }
  }
  
  const newInstall = await isNewInstall(shopDomain);
  const path = (await cookies()).get('next-path')?.value;
  
  // If it's a new install and they aren't already going to the pricing page, redirect them.
  if (newInstall && path !== '/pricing') {
     redirect('/pricing');
  }

  const plan = await getShopPlan(shopDomain);

  // Pass shopDomain and plan to all children
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { plan, shop: shopDomain } as any);
    }
    return child;
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:w-min">
            <Logo />
            <span className="text-xl font-semibold tracking-tighter group-data-[collapsible=icon]:hidden">
              Kora Wallet
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav plan={plan} />
        </SidebarContent>
        <SidebarFooter className="flex-col !items-start gap-4 p-2">
          <div className="flex w-full items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={userAvatar.description} data-ai-hint={userAvatar.imageHint} />}
                <AvatarFallback>SO</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Store Owner</span>
                <span className="text-xs text-muted-foreground capitalize">{plan} Plan</span>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{childrenWithProps}</main>
        <Chatbot shop={shopDomain} />
      </SidebarInset>
    </SidebarProvider>
  );
}
