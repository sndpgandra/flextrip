'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Users, Loader2 } from 'lucide-react';
import type { ChatMessage, Traveler } from '@/types';
import TravelerContextBar from './TravelerContextBar';
import MessageList from './MessageList';

interface ChatInterfaceProps {
  sessionId: string;
  travelers: Traveler[];
  onSaveTrip?: (title: string, messages: ChatMessage[]) => void;
}

export default function ChatInterface({ sessionId, travelers, onSaveTrip }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message when component mounts
    if (travelers.length > 0 && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm FlexiTrip, your AI travel assistant. I can see you're planning a trip for ${travelers.length} ${travelers.length === 1 ? 'person' : 'people'}. I'll make sure to suggest activities that work for everyone in your group.\n\nWhere would you like to go, or what kind of trip are you thinking about?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [travelers, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          travelers,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      if (result.success) {
        setMessages(prev => [...prev, result.data.message]);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveTrip = () => {
    if (onSaveTrip && messages.length > 1) {
      // Extract destination from conversation or use generic title
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
      const title = extractTripTitle(firstUserMessage) || 'My Trip Plan';
      onSaveTrip(title, messages);
    }
  };

  const extractTripTitle = (message: string): string => {
    // Simple logic to extract destination from first message
    const lowerMessage = message.toLowerCase();
    
    // Look for common travel phrases
    const patterns = [
      /(?:go to|visit|trip to|traveling to)\s+([^.!?]+)/i,
      /(?:in|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return `Trip to ${match[1].trim()}`;
      }
    }
    
    return 'My Trip Plan';
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header with Traveler Context */}
      <div className="bg-background border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-2xl font-bold">FlexiTrip Chat</h1>
          </div>
          {messages.length > 1 && (
            <Button variant="outline" onClick={handleSaveTrip}>
              Save Trip
            </Button>
          )}
        </div>
        <TravelerContextBar travelers={travelers} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2">
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your trip..."
            disabled={isLoading}
            className="flex-1"
            maxLength={4000}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}