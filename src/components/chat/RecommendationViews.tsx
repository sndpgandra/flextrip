'use client';

import { useState, useEffect } from 'react';
import ViewToggle, { ViewMode } from './ViewToggle';
import CategoryView from './CategoryView';
import DayView from './DayView';
import { RecommendationData } from './RecommendationCard';
import { parseAIResponse } from '@/lib/utils/responseParser';

interface RecommendationViewsProps {
  messageContent: string;
  structuredRecommendations?: any[];
  onSaveTrip?: () => void;
  sharedItinerary?: RecommendationData[];
  onUpdateItinerary?: (itinerary: RecommendationData[]) => void;
}

export default function RecommendationViews({
  messageContent,
  structuredRecommendations,
  onSaveTrip,
  sharedItinerary = [],
  onUpdateItinerary
}: RecommendationViewsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Debug log when view mode changes
  const handleViewChange = (newView: ViewMode) => {
    console.log('Switching to view:', newView, 'Current shared itinerary length:', sharedItinerary.length);
    setViewMode(newView);
  };

  // Parse the AI response into structured recommendations
  useEffect(() => {
    const parsed = parseAIResponse(messageContent, structuredRecommendations);
    if (parsed.hasRecommendations) {
      setRecommendations(parsed.recommendations);
    }
  }, [messageContent, structuredRecommendations]);

  const handleAddToDay = (recommendation: RecommendationData) => {
    console.log('Adding to shared day:', recommendation.title);
    if (!onUpdateItinerary) return;
    
    // Add to shared itinerary if not already there
    if (!sharedItinerary.find(item => item.id === recommendation.id)) {
      const newItinerary = [...sharedItinerary, recommendation];
      console.log('New shared itinerary length:', newItinerary.length);
      onUpdateItinerary(newItinerary);
    } else {
      console.log('Item already in shared itinerary');
    }
  };

  const handleRemoveFromDay = (recommendationId: string) => {
    if (!onUpdateItinerary) return;
    const newItinerary = sharedItinerary.filter(item => item.id !== recommendationId);
    onUpdateItinerary(newItinerary);
  };

  const handleToggleFavorite = (recommendationId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recommendationId)) {
      newFavorites.delete(recommendationId);
    } else {
      newFavorites.add(recommendationId);
    }
    setFavorites(newFavorites);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export itinerary:', sharedItinerary);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share itinerary:', sharedItinerary);
  };

  // If no recommendations found, don't show the views
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* View Toggle Controls */}
      <ViewToggle
        currentView={viewMode}
        onViewChange={handleViewChange}
        onSave={onSaveTrip}
        onExport={handleExport}
        onShare={handleShare}
        hasRecommendations={recommendations.length > 0}
      />

      {/* Content Views */}
      {viewMode === 'category' ? (
        <CategoryView
          recommendations={recommendations}
          onAddToDay={handleAddToDay}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />
      ) : (
        <DayView
          recommendations={sharedItinerary}
          onAddToDay={handleAddToDay}
          onRemoveFromDay={handleRemoveFromDay}
        />
      )}

      {/* Debug: Show current itinerary state */}
      <div className="text-xs text-gray-500 mt-2">
        Debug: Shared Itinerary has {sharedItinerary.length} items
        {sharedItinerary.length > 0 && (
          <div>Items: {sharedItinerary.map(item => item.title).join(', ')}</div>
        )}
      </div>

      {/* Quick Stats */}
      {recommendations.length > 0 && (
        <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground border-t pt-4">
          <span>{recommendations.length} recommendations</span>
          <span>{favorites.size} favorites</span>
          <span>{sharedItinerary.length} in itinerary</span>
        </div>
      )}
    </div>
  );
}