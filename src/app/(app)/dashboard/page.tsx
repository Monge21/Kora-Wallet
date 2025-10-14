import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Activity,
  Sparkles,
  Bell,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { getDashboardData, type ShopifyDashboardData } from '@/app/actions/shopify-data';

const alerts = [
  {
    title: 'High-performing product detected',
    description: 'Consider increasing the price of "Premium Organic Coffee Beans" by 10% to maximize profit.',
    icon: Sparkles,
    type: 'suggestion',
  },
  {
    title: 'Low stock warning for "Artisan Mug"',
    description: 'Only 15 units left. Restock soon to avoid losing sales.',
    icon: Bell,
    type: 'warning',
  },
  {
    title: 'New AOV optimization available',
    description: 'Bundle "Coffee Beans" with "Artisan Mug" for a 15% discount to increase average order value.',
    icon: Sparkles,
    type: 'suggestion',
  },
];

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(parseFloat(amount));
}


export default async function DashboardPage({ plan, shop }: { plan: 'basic' | 'growth' | 'pro', shop: string }) {
  let dashboardData: ShopifyDashboardData | null = null;
  if (shop) {
    dashboardData = await getDashboardData(shop);
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: dashboardData ? formatCurrency(dashboardData.totalSales.amount, dashboardData.totalSales.currencyCode) : '$0.00',
      change: 'from last 30 days',
      icon: DollarSign,
    },
    {
      title: 'Average Order Value',
      value: dashboardData ? formatCurrency(dashboardData.averageOrderValue.amount, dashboardData.averageOrderValue.currencyCode) : '$0.00',
      change: 'from last 30 days',
      icon: TrendingUp,
    },
    {
      title: 'Total Orders',
      value: dashboardData ? dashboardData.totalOrders.toString() : '0',
      change: 'from last 30 days',
      icon: CreditCard,
    },
    {
      title: 'Conversion Rate',
      value: '3.45%', // This metric is complex to calculate and is left as a placeholder
      change: '+1.5% from last month',
      icon: Activity,
    },
  ];

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Recommendations</CardTitle>
            <CardDescription>
              AI-powered insights to help you grow your store.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {alerts.map((alert) => (
              <div key={alert.title} className="flex items-start gap-4">
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg ${alert.type === 'suggestion' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                    <alert.icon className={`h-4 w-4 ${alert.type === 'suggestion' ? 'text-accent-foreground' : 'text-yellow-600 dark:text-yellow-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            An overview of your most recent transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData && dashboardData.recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={sale.avatar} alt="Avatar" data-ai-hint="person" />
                        <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">{sale.name}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {sale.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.amount, sale.currencyCode)}</TableCell>
                </TableRow>
              ))}
               {!dashboardData && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Could not load sales data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
