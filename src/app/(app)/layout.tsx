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
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { initializeFirebase } from '@/firebase/server';
import { cookies } from 'next/headers';
import React from 'react';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Kora Wallet',
  description: 'AI-powered analytics and tools for your Shopify store.',
};

// Server-side function to get shop plan using firebase-admin
async function getShopPlan(shopDomain: string | undefined): Promise<'basic' | 'growth' | 'pro'> {
  if (!shopDomain) return 'basic'; // Default plan
  try {
    const { firestore } = initializeFirebase();
    const shopsCollection = firestore.collection('shops');
    const querySnapshot = await shopsCollection.where('domain', '==', shopDomain).get();

    if (querySnapshot.empty) {
      console.warn(`Shop not found for domain: ${shopDomain}`);
      return 'basic';
    }

    const shopData = querySnapshot.docs[0].data();
    return shopData.plan || 'basic';
  } catch (error) {
    console.error('Error fetching shop plan:', error);
    return 'basic';
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  const cookieStore = await cookies();
  const shopDomain = cookieStore.get('shop')?.value;

  if (!shopDomain) {
    // Redirect to install page if no shop cookie is present
    redirect('/install');
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
            <Link href={`/api/auth/logout`} className="group-data-[collapsible=icon]:hidden">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </Link>
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
      </SidebarInset>
    </SidebarProvider>
  );
}