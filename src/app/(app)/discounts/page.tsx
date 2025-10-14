'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDiscountCode, getDiscountCodes, type ShopifyDiscount } from '@/app/actions/shopify-data';
import { useToast } from '@/hooks/use-toast';

export default function DiscountsPage({ shop }: { shop: string }) {
  const [discounts, setDiscounts] = useState<ShopifyDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
  });
  const { toast } = useToast();

  const fetchDiscounts = async () => {
    if (!shop) return;
    setIsLoading(true);
    try {
      const fetchedDiscounts = await getDiscountCodes(shop);
      setDiscounts(fetchedDiscounts);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching discounts',
        description: error instanceof Error ? error.message : 'Could not load discounts from Shopify.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [shop]);

  const handleCreateDiscount = async () => {
    if (!shop) {
      toast({ variant: 'destructive', title: 'Error', description: 'Shop domain is missing.' });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createDiscountCode(shop, {
        code: newDiscount.code,
        type: newDiscount.type as 'PERCENTAGE' | 'FIXED_AMOUNT',
        value: parseFloat(newDiscount.value),
      });

      if (result.success) {
        toast({
          title: 'Discount Created',
          description: `Discount code "${result.code}" was successfully created.`,
        });
        await fetchDiscounts(); // Re-fetch discounts to show the new one
        setIsDialogOpen(false);
        setNewDiscount({ code: '', type: 'PERCENTAGE', value: '' });
      } else {
        throw new Error(result.error || 'Failed to create discount.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Discount',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Discounts</CardTitle>
            <CardDescription>
              Manage and create discount codes for your store.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Discount</DialogTitle>
                <DialogDescription>
                  Create a new discount code for your customers. This will create a real discount in your Shopify store.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={newDiscount.code}
                    onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                    className="col-span-3"
                    placeholder="E.g. SUMMER25"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newDiscount.type}
                    onValueChange={(value) => setNewDiscount({ ...newDiscount, type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                       <SelectItem value="FREE_SHIPPING" disabled>Free Shipping (coming soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={newDiscount.value}
                    onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
                    className="col-span-3"
                    placeholder={newDiscount.type === 'PERCENTAGE' ? 'E.g. 20' : 'E.g. 15.00'}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateDiscount} disabled={isCreating || !newDiscount.code || !newDiscount.value}>
                  {isCreating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    'Create Discount'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : discounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No discounts found.
                  </TableCell>
                </TableRow>
              ) : (
                discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.code}</TableCell>
                    <TableCell>{discount.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={discount.status === 'ACTIVE' ? 'secondary' : 'outline'}
                        className={
                          discount.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : ''
                        }
                      >
                        {discount.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{discount.usageCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                          <DropdownMenuItem disabled>Deactivate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" disabled>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}