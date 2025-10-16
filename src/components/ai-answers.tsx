'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { aiAnswers } from '@/ai/flows/ai-answers-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export function AIAnswers({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await aiAnswers({ question: input });
      const aiMessage: Message = { sender: 'ai', text: result.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error getting answer',
        description:
          err instanceof Error ? err.message : 'An unknown error occurred.',
      });
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I ran into a problem. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h2 className="font-semibold">AI Answers</h2>
                <p className="text-xs text-muted-foreground">Instant answers to your questions</p>
            </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              {message.sender === 'user' && (
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
               <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              <div className="rounded-lg px-3 py-2 bg-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </footer>
    </div>
  );
}