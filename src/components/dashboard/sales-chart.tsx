'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart as BarChartIcon } from 'lucide-react';

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--primary))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--accent))',
  },
} as const;

export function SalesChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>A summary of sales activity.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="desktop"
                fill="var(--color-desktop)"
                radius={4}
              />
              <Bar
                dataKey="mobile"
                fill="var(--color-mobile)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Not enough data to display chart.
              </p>
              <p className="text-xs text-muted-foreground">
                Sales data will appear here once you make some sales.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}