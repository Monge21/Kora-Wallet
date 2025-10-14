
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Tag,
  BrainCircuit,
  TrendingUp,
  Target,
  FileText,
  DollarSign,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LucideIcon } from 'lucide-react';

type Plan = 'basic' | 'growth' | 'pro';

const planHierarchy: Record<Plan, number> = {
  basic: 1,
  growth: 2,
  pro: 3,
};

type MenuItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  requiredPlan: Plan;
  subItems?: Omit<MenuItem, 'subItems'>[];
};

const menuItems: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    requiredPlan: 'basic',
  },
  {
    href: '/discounts',
    label: 'Discounts',
    icon: Tag,
    requiredPlan: 'basic',
  },
  {
    label: 'AI Tools',
    icon: BrainCircuit,
    requiredPlan: 'growth',
    subItems: [
      {
        href: '/predict-sales',
        label: 'Sales Prediction',
        icon: TrendingUp,
        requiredPlan: 'growth',
      },
      {
        href: '/pricing-suggestions',
        label: 'Pricing Suggestions',
        icon: FileText,
        requiredPlan: 'growth',
      },
      {
        href: '/aov-optimization',
        label: 'AOV Optimization',
        icon: Target,
        requiredPlan: 'pro',
      },
    ],
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: DollarSign,
    requiredPlan: 'basic',
  },
];

export function MainNav({ plan }: { plan: Plan }) {
  const pathname = usePathname();
  const userLevel = planHierarchy[plan] || 1;

  const availableMenuItems = menuItems
    .filter(item => userLevel >= planHierarchy[item.requiredPlan])
    .map(item => {
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter(subItem => userLevel >= planHierarchy[subItem.requiredPlan]),
        };
      }
      return item;
    })
    .filter(item => !item.subItems || item.subItems.length > 0);

  return (
    <SidebarMenu>
      {availableMenuItems.map((item) =>
        item.subItems ? (
          <SidebarMenuItem key={item.label} asChild>
            <Collapsible
              defaultOpen={item.subItems.some((sub) =>
                pathname.startsWith(sub.href!)
              )}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="w-full"
                  variant="default"
                  isActive={item.subItems.some((sub) =>
                    pathname.startsWith(sub.href!)
                  )}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.subItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <Link href={subItem.href!}>
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.href}
                        >
                          <subItem.icon />
                          <span>{subItem.label}</span>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem key={item.href} asChild>
            <Link href={item.href!}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )
      )}
    </SidebarMenu>
  );
}
