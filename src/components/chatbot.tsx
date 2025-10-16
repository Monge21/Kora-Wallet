'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Mail, Search, Sparkles, X } from 'lucide-react';
import { AIAnswers } from '@/components/ai-answers';
import { HelpDocs } from '@/components/help-docs';
import { EmailSupport } from '@/components/email-support';

type ChatView = 'main' | 'ai-answers' | 'help-docs' | 'email-support';

export function Chatbot({ shop }: { shop?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>('main');

  const handleBack = () => setView('main');

  const renderView = () => {
    switch (view) {
      case 'ai-answers':
        return <AIAnswers onBack={handleBack} />;
      case 'help-docs':
        return <HelpDocs onBack={handleBack} />;
      case 'email-support':
        return <EmailSupport onBack={handleBack} shop={shop} />;
      case 'main':
      default:
        return (
          <div className="p-4">
            <div className="text-center mb-6">
                <h2 className="text-lg font-semibold">Start a conversation</h2>
                <p className="text-sm text-muted-foreground">What channel do you prefer?</p>
            </div>
            <div className="space-y-3">
              <button
                className="w-full text-left p-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-4 border"
                onClick={() => setView('ai-answers')}
              >
                <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">AI Answers</p>
                  <p className="text-sm text-muted-foreground">
                    Instant answers to your questions
                  </p>
                </div>
              </button>
              <button
                className="w-full text-left p-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-4 border"
                onClick={() => setView('help-docs')}
              >
                <div className="p-2 bg-muted-foreground/10 rounded-full">
                    <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Help docs</p>
                  <p className="text-sm text-muted-foreground">
                    Search the knowledge base
                  </p>
                </div>
              </button>
               <button
                className="w-full text-left p-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-4 border"
                onClick={() => setView('email-support')}
              >
                <div className="p-2 bg-muted-foreground/10 rounded-full">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">
                    We usually respond within a few hours
                  </p>
                </div>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-4 right-4 rounded-full shadow-lg h-14 w-auto px-6"
        >
          {isOpen ? <X className="h-6 w-6" /> : <ChevronDown className="h-5 w-5 mr-2" />}
          <span className="text-base">{isOpen ? '' : 'Contact us'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[380px] h-[500px] rounded-2xl shadow-2xl p-0 overflow-hidden"
        onInteractOutside={(e) => {
            // Allow interaction inside other popovers
            if((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
                e.preventDefault();
            }
        }}
        >
        {renderView()}
      </PopoverContent>
    </Popover>
  );
}
