'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Users, Loader2, CheckCircle } from 'lucide-react';
import type { ChatMessage, Traveler } from '@/types';
import { RecommendationData } from './RecommendationCard';
import MessageList from './MessageList';
import FamilySidebar from './FamilySidebar';
// SearchBar removed - functionality moved to sidebar
import Logo from '@/components/ui/Logo';
import { useTravelContext } from '@/hooks/useTravelContext';

interface ChatInterfaceProps {
  sessionId: string;
  travelers: Traveler[];
  onSaveTrip?: (title: string, messages: ChatMessage[]) => void;
  isSaving?: boolean;
  saveSuccess?: string;
  onAddTraveler?: () => void;
  onEditTraveler?: (traveler: Traveler) => void;
  onRemoveTraveler?: (travelerId: string) => void;
  onNewTrip?: () => void;
  currentTripTitle?: string;
  onUpdateTravelers?: (travelers: Traveler[]) => void;
}

export default function ChatInterface({ 
  sessionId, 
  travelers, 
  onSaveTrip, 
  isSaving, 
  saveSuccess,
  onAddTraveler,
  onEditTraveler,
  onRemoveTraveler,
  onNewTrip,
  currentTripTitle,
  onUpdateTravelers
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sharedItinerary, setSharedItinerary] = useState<RecommendationData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context state management
  const [travelPreferences, setTravelPreferences] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    budget: '',
    tripType: [] as string[]
  });

  const [culturalSettings, setCulturalSettings] = useState({
    culturalBackground: [] as string[],
    dietaryRestrictions: [] as string[],
    familyInterests: [] as string[]
  });

  // Generate travel context
  const travelContext = useTravelContext({
    travelers,
    travelPreferences,
    culturalSettings
  });

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
          travelContext: travelContext.contextPrompt, // Add travel context
          preferences: travelPreferences,
          culturalSettings,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      if (result.success) {
        const messageWithRecommendations = {
          ...result.data.message,
          structured_recommendations: result.data.structured_recommendations || []
        };
        setMessages(prev => [...prev, messageWithRecommendations]);
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

  // Handle context updates from sidebar (batch add/remove travelers)
  const handleUpdateContext = async (updates: {
    newTravelers?: any[];
    updatedTravelers?: Traveler[];
    removedTravelerIds?: string[];
  }) => {
    try {
      // Handle new travelers
      if (updates.newTravelers && updates.newTravelers.length > 0) {
        for (const newTraveler of updates.newTravelers) {
          const response = await fetch('/api/travelers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              traveler: {
                name: newTraveler.name,
                age: newTraveler.age,
                relationship: newTraveler.relationship,
                mobility: newTraveler.mobility,
                interests: newTraveler.interests,
                dietary_restrictions: newTraveler.dietary_restrictions,
              },
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add traveler');
          }
        }
      }

      // Handle removed travelers
      if (updates.removedTravelerIds && updates.removedTravelerIds.length > 0) {
        for (const travelerId of updates.removedTravelerIds) {
          if (onRemoveTraveler) {
            onRemoveTraveler(travelerId);
          }
        }
      }

      // Refresh travelers list if we have the callback
      if (onUpdateTravelers) {
        // Re-fetch travelers to get updated list
        const response = await fetch('/api/session');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.travelers) {
            onUpdateTravelers(result.data.travelers);
          }
        }
      }

    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation Bar - Modern Style */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo variant="full" size="md" />
            
            {/* Save Trip Button */}
            {messages.length > 1 && (
              <button 
                onClick={handleSaveTrip}
                disabled={isSaving}
                className="flexitrip-button-primary flexitrip-button-compact disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Trip'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search functionality moved to sidebar */}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 bg-[rgb(var(--background-light))]">
        {/* Enhanced Sidebar - Expanded Width */}
        <div className={`bg-white border-r border-[rgb(var(--border-light))] transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        }`}>
          <FamilySidebar
            travelers={travelers}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onAddTraveler={onAddTraveler || (() => {})} 
            onEditTraveler={onEditTraveler || (() => {})}
            onRemoveTraveler={onRemoveTraveler || (() => {})}
            onNewTrip={onNewTrip || (() => {})}
            currentTripTitle={currentTripTitle}
            travelPreferences={travelPreferences}
            onTravelPreferencesChange={setTravelPreferences}
            culturalSettings={culturalSettings}
            onCulturalSettingsChange={setCulturalSettings}
            travelContext={travelContext}
            onUpdateContext={handleUpdateContext}
          />
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <MessageList 
                  messages={messages} 
                  isLoading={isLoading} 
                  onSaveTrip={handleSaveTrip}
                  sharedItinerary={sharedItinerary}
                  onUpdateItinerary={setSharedItinerary}
                />
              </div>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Success/Error Display */}
          {(error || saveSuccess) && (
            <div className="max-w-4xl mx-auto px-4 py-2">
              {error && (
                <Card className="border-destructive mb-2">
                  <CardContent className="pt-4">
                    <p className="text-destructive text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}
              {saveSuccess && (
                <Card className="border-green-500 bg-green-50 mb-2">
                  <CardContent className="pt-4">
                    <p className="text-green-700 text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {saveSuccess}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Modern Input Area */}
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your trip planning..."
                    disabled={isLoading}
                    rows={1}
                    maxLength={4000}
                    className="flexitrip-input resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="flexitrip-button-primary rounded-full h-11 w-11 p-0 flex-shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs flexitrip-text-secondary mt-3 text-center">
                <span className="hidden sm:inline">Press Enter to send • Shift+Enter for new line • </span>
                <span className="sm:hidden">Tap to send • </span>
                {4000 - inputMessage.length} characters remaining
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}