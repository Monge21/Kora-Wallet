import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Activity,
  BarChart,
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
      value: '0.00%', // This metric is complex to calculate and is left as a placeholder
      change: 'from last month',
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
          <SalesChart data={[]} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Recommendations</CardTitle>
            <CardDescription>
              AI-powered insights to help you grow your store.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                    <BarChart className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        No recommendations yet.
                    </p>
                </div>
            </div>
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
              {dashboardData && dashboardData.recentSales.length > 0 ? (
                dashboardData.recentSales.map((sale) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No recent sales to display.
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