'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { sendSupportEmail } from '@/app/actions/support';

export function EmailSupport({ onBack, shop }: { onBack: () => void; shop?: string }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out both the subject and message fields.',
        });
        return;
    }

    setIsSending(true);
    
    const result = await sendSupportEmail({ subject, message, shop });

    setIsSending(false);

    if (result.success) {
      toast({
          title: 'Message Sent!',
          description: 'Our support team will get back to you shortly.',
      });
      setSubject('');
      setMessage('');
      onBack();
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Message',
        description: result.error || 'An unknown error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-muted-foreground" />
            <div>
                <h2 className="font-semibold">Email Support</h2>
                <p className="text-xs text-muted-foreground">We typically reply within a few hours</p>
            </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="p-4 space-y-4 flex-1">
            <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g., Issue with sales prediction"
                    disabled={isSending}
                />
            </div>
            <div className="flex-1 flex flex-col">
                <Label htmlFor="message">Message</Label>
                <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    className="flex-1 resize-none"
                    disabled={isSending}
                />
            </div>
        </div>

        <footer className="p-4 border-t">
            <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Message</>
            )}
            </Button>
        </footer>
      </form>
    </div>
  );
}
