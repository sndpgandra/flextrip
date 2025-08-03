'use client';

import { Card, CardContent } from '@/components/ui/card';
import { User, Bot, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import RecommendationViews from './RecommendationViews';
import { parseAIResponse } from '@/lib/utils/responseParser';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSaveTrip?: () => void;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ messages, isLoading, onSaveTrip }: MessageListProps) {

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-full">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} onSaveTrip={onSaveTrip} />
      ))}
      
      {isLoading && (
        <Card className="max-w-3xl">
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">FlexiTrip is thinking...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessageBubble({ message, onSaveTrip }: { message: ChatMessage; onSaveTrip?: () => void }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Card className={`max-w-3xl w-full ${isUser ? 'bg-primary text-primary-foreground' : ''}`}>
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-primary-foreground/20' : 'bg-primary'
              }`}>
                {isUser ? (
                  <User className={`h-4 w-4 ${isUser ? 'text-primary-foreground' : 'text-primary-foreground'}`} />
                ) : (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-sm font-medium ${
                  isUser ? 'text-primary-foreground' : 'text-foreground'
                }`}>
                  {isUser ? 'You' : 'FlexiTrip'}
                </span>
                <span className={`text-xs ${
                  isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className={`prose prose-sm max-w-none break-words ${
                isUser ? 'text-primary-foreground prose-invert' : 'text-foreground'
              }`}>
                <MessageContent content={message.content} />
              </div>
              
              {/* Show enhanced recommendations for assistant messages */}
              {!isUser && <RecommendationViews messageContent={message.content} onSaveTrip={onSaveTrip} />}
              {message.metadata && (
                <div className={`mt-2 text-xs ${
                  isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {message.metadata.model_used && (
                    <span>Model: {message.metadata.model_used}</span>
                  )}
                  {message.metadata.tokens_used && (
                    <span className="ml-2">Tokens: {message.metadata.tokens_used}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple formatting for now - could be enhanced with markdown parsing
  const paragraphs = content.split('\n\n');
  
  return (
    <div className="space-y-3 overflow-wrap-anywhere">
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph contains a list
        if (paragraph.includes('\n-') || paragraph.includes('\n•')) {
          const lines = paragraph.split('\n');
          const title = lines[0];
          const items = lines.slice(1).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
          
          return (
            <div key={index}>
              {title && <p className="font-medium mb-2">{title}</p>}
              <ul className="list-disc list-inside space-y-1 ml-4">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm">
                    {item.replace(/^[\s-•]+/, '')}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        
        return (
          <p key={index} className="text-sm leading-relaxed">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}