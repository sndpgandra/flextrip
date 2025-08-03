'use client';

import { useState, useEffect } from 'react';
import ViewToggle, { ViewMode } from './ViewToggle';
import CategoryView from './CategoryView';
import DayView from './DayView';
import { RecommendationData } from './RecommendationCard';
import { parseAIResponse } from '@/lib/utils/responseParser';

interface RecommendationViewsProps {
  messageContent: string;
  onSaveTrip?: () => void;
}

export default function RecommendationViews({
  messageContent,
  onSaveTrip
}: RecommendationViewsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [itinerary, setItinerary] = useState<RecommendationData[]>([]);

  // Parse the AI response into structured recommendations
  useEffect(() => {
    const parsed = parseAIResponse(messageContent);
    if (parsed.hasRecommendations) {
      setRecommendations(parsed.recommendations);
    }
  }, [messageContent]);

  const handleAddToDay = (recommendation: RecommendationData) => {
    // Add to itinerary if not already there
    if (!itinerary.find(item => item.id === recommendation.id)) {
      setItinerary(prev => [...prev, recommendation]);
      // Show a success message or animation here
    }
  };

  const handleRemoveFromDay = (recommendationId: string) => {
    setItinerary(prev => prev.filter(item => item.id !== recommendationId));
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
    console.log('Export itinerary:', itinerary);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share itinerary:', itinerary);
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
        onViewChange={setViewMode}
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
          recommendations={itinerary}
          onAddToDay={handleAddToDay}
          onRemoveFromDay={handleRemoveFromDay}
        />
      )}

      {/* Quick Stats */}
      {recommendations.length > 0 && (
        <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground border-t pt-4">
          <span>{recommendations.length} recommendations</span>
          <span>{favorites.size} favorites</span>
          <span>{itinerary.length} in itinerary</span>
        </div>
      )}
    </div>
  );
}