'use client';

import { useState } from 'react';
import { ArrowLeft, Book, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from './ui/scroll-area';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  content: React.ReactNode;
}

const articles: Article[] = [
  { 
    slug: 'setup-discount',
    title: 'How to set up your first discount', 
    excerpt: 'A step-by-step guide to creating and managing discounts in your store.',
    content: (
        <div className="space-y-4 text-sm">
            <p>Creating discounts for your customers is a great way to boost sales. Here’s how to do it in Kora Wallet:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>Navigate to the <strong>Discounts</strong> page from the main menu.</li>
                <li>Click the <strong>Create Discount</strong> button in the top right corner.</li>
                <li>A dialog will appear. Fill in the <strong>Discount Code</strong> you want to use (e.g., SUMMER25).</li>
                <li>Select the discount <strong>Type</strong>: either 'Percentage' or 'Fixed Amount'.</li>
                <li>Enter the discount <strong>Value</strong> (e.g., 25 for 25% off, or 10 for $10 off).</li>
                <li>Click <strong>Create Discount</strong>. The discount will be instantly created in your Shopify store and will appear in your list.</li>
            </ol>
        </div>
    )
  },
  { 
    slug: 'sales-predictions',
    title: 'Understanding the AI Sales Predictions', 
    excerpt: 'Learn how our AI analyzes data to forecast your sales.',
    content: (
        <div className="space-y-4 text-sm">
            <p>Our Sales Prediction tool uses AI to forecast future product demand based on your store's data and market trends.</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>Go to the <strong>AI Tools &gt; Sales Prediction</strong> page.</li>
                <li>Select a product from your store using the dropdown menu. Its current inventory will be pre-filled.</li>
                <li>Provide context in the <strong>Historical Sales Data</strong> text box. For example, "Sales are highest on weekends" or "Last year's holiday season saw a 50% spike."</li>
                <li>Add information in the <strong>Market Trends</strong> box, like "Sustainable products are becoming more popular" or "A major competitor just launched a sale."</li>
                <li>Click <strong>Predict Sales</strong>. The AI will analyze all inputs and provide a predicted sales number for the next 30 days, along with a confidence score and an explanation.</li>
            </ol>
        </div>
    )
  },
  { 
    slug: 'aov-optimization',
    title: 'Optimizing your Average Order Value (AOV)', 
    excerpt: 'Strategies and tools to help you increase your AOV.',
    content: (
        <div className="space-y-4 text-sm">
            <p>The AOV Optimization tool gives you AI-powered recommendations to encourage customers to spend more per order.</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>This feature is available on the <strong>Pro Plan</strong>. Ensure you are subscribed.</li>
                <li>Navigate to <strong>AI Tools &gt; AOV Optimization</strong>.</li>
                <li>Your most popular products will be pre-filled. You can add or remove products from the list.</li>
                <li>Enter your store's current <strong>Average Order Value</strong> if you know it.</li>
                <li>For each product, fill in the price and an estimate of recent sales (e.g., sales in the last month).</li>
                <li>Click <strong>Optimize AOV</strong>. The AI will provide specific recommendations, such as product bundling ideas or tiered discount strategies.</li>
            </ol>
        </div>
    )
  },
  { 
    slug: 'billing-plans',
    title: 'How billing and plans work', 
    excerpt: 'An overview of our subscription plans and billing cycles.',
    content: (
        <div className="space-y-4 text-sm">
            <p>Kora Wallet billing is handled securely through Shopify. You will be billed on your regular Shopify invoice.</p>
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Choosing a Plan:</strong> After installing, you'll be directed to the Pricing page. Simply select the plan that fits your needs (Basic, Growth, or Pro).</li>
                <li><strong>Confirmation:</strong> Shopify will ask you to approve the recurring charge. Once you approve, your subscription is active.</li>
                <li><strong>Upgrading/Downgrading:</strong> You can change your plan at any time from the Pricing page in the app.</li>
                <li><strong>Billing Cycle:</strong> Subscriptions are charged either every 30 days or annually, depending on your choice during checkout.</li>
            </ul>
        </div>
    )
  },
];

export function HelpDocs({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else {
      onBack();
    }
  }

  if (selectedArticle) {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 overflow-hidden">
                    <Book className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <h2 className="font-semibold truncate" title={selectedArticle.title}>{selectedArticle.title}</h2>
                        <p className="text-xs text-muted-foreground">Step-by-step guide</p>
                    </div>
                </div>
            </header>
            <ScrollArea className="flex-1">
                <div className="p-6">
                    {selectedArticle.content}
                </div>
            </ScrollArea>
             <footer className="p-4 border-t">
                <Button variant="ghost" onClick={handleBack} className="w-full">Back to articles</Button>
            </footer>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-muted-foreground" />
            <div>
                <h2 className="font-semibold">Help Docs</h2>
                <p className="text-xs text-muted-foreground">Search the knowledge base</p>
            </div>
        </div>
      </header>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredArticles.map((article) => (
            <button key={article.slug} onClick={() => setSelectedArticle(article)} className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-start gap-4">
              <Book className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{article.title}</p>
                <p className="text-xs text-muted-foreground">{article.excerpt}</p>
              </div>
            </button>
          ))}
          {filteredArticles.length === 0 && (
            <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">No articles found for &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

