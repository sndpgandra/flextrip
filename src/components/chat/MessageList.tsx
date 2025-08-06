'use client';

import { Card, CardContent } from '@/components/ui/card';
import { User, Bot, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { RecommendationData } from './RecommendationCard';
import RecommendationViews from './RecommendationViews';
import { parseAIResponse } from '@/lib/utils/responseParser';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSaveTrip?: () => void;
  sharedItinerary?: RecommendationData[];
  onUpdateItinerary?: (itinerary: RecommendationData[]) => void;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ 
  messages, 
  isLoading, 
  onSaveTrip, 
  sharedItinerary = [], 
  onUpdateItinerary 
}: MessageListProps) {

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {messages.map((message, index) => (
        <MessageBubble 
          key={index} 
          message={message} 
          onSaveTrip={onSaveTrip}
          sharedItinerary={sharedItinerary}
          onUpdateItinerary={onUpdateItinerary}
        />
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-3xl flexitrip-card p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[rgb(var(--primary-brand))] rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[rgb(var(--primary-brand))]" />
                  <span className="text-sm flexitrip-text-secondary">FlexiTrip is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ 
  message, 
  onSaveTrip,
  sharedItinerary,
  onUpdateItinerary
}: { 
  message: ChatMessage; 
  onSaveTrip?: () => void;
  sharedItinerary?: RecommendationData[];
  onUpdateItinerary?: (itinerary: RecommendationData[]) => void;
}) {
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
      <div className={`max-w-3xl w-full rounded-2xl p-4 sm:p-6 transition-all duration-200 ${
        isUser 
          ? 'flexitrip-gradient-bg text-white ml-4 sm:ml-12 shadow-lg' 
          : 'flexitrip-card mr-4 sm:mr-12'
      }`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-white/20' 
                : 'bg-[rgb(var(--background-blue-light))]'
            }`}>
              {isUser ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-[rgb(var(--primary-brand))]" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-sm sm:text-base font-semibold ${
                isUser ? 'text-white' : 'flexitrip-text-primary'
              }`}>
                {isUser ? 'You' : 'FlexiTrip'}
              </span>
              <span className={`text-xs ${
                isUser ? 'text-white/70' : 'flexitrip-text-light'
              }`}>
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
            <div className={`${
              isUser ? 'text-white' : 'flexitrip-text-primary'
            } leading-relaxed`}>
              <MessageContent content={message.content} />
            </div>
            
            {/* Show enhanced recommendations for assistant messages */}
            {!isUser && (
              <RecommendationViews 
                messageContent={message.content} 
                structuredRecommendations={message.structured_recommendations}
                onSaveTrip={onSaveTrip}
                sharedItinerary={sharedItinerary}
                onUpdateItinerary={onUpdateItinerary}
              />
            )}
            
            {/* Metadata */}
            {message.metadata && (
              <div className={`mt-3 text-xs ${
                isUser ? 'text-white/50' : 'flexitrip-text-light'
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
      </div>
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