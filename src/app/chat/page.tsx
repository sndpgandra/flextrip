'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import type { Traveler, ChatMessage } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const response = await fetch('/api/session');
      const result = await response.json();
      
      if (result.success) {
        setSessionId(result.data.sessionId);
        setTravelers(result.data.travelers);
        
        // If no travelers, redirect to onboarding
        if (result.data.travelers.length === 0) {
          router.push('/onboarding');
          return;
        }
      } else {
        setError('Failed to load session data');
      }
    } catch (error) {
      console.error('Chat initialization error:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = async (title: string, messages: ChatMessage[]) => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          title,
          traveler_ids: travelers.map(t => t.id),
          conversation: messages,
          destination: extractDestination(messages),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success message or redirect to trips page
        console.log('Trip saved successfully');
      } else {
        console.error('Failed to save trip:', result.error);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const extractDestination = (messages: ChatMessage[]): string | undefined => {
    // Simple extraction logic - could be enhanced with NLP
    const userMessages = messages.filter(m => m.role === 'user');
    for (const message of userMessages) {
      const match = message.content.match(/(?:go to|visit|trip to|traveling to)\s+([^.!?]+)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your travel profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeChat} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (travelers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              No Travelers Found
            </CardTitle>
            <CardDescription>
              You need to set up your family profile before you can start planning trips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/onboarding')}>
              Set Up Family Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ChatInterface
      sessionId={sessionId}
      travelers={travelers}
      onSaveTrip={handleSaveTrip}
    />
  );
}