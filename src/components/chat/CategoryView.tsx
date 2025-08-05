'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModernCard from '@/components/ui/ModernCard';
import ModernGrid from '@/components/ui/ModernGrid';
import RecommendationCard, { RecommendationData } from './RecommendationCard';

interface CategoryViewProps {
  recommendations: RecommendationData[];
  onAddToDay?: (recommendation: RecommendationData) => void;
  onToggleFavorite?: (recommendationId: string) => void;
  favorites?: Set<string>;
}

const categoryLabels = {
  attraction: { 
    title: '🏛️ Attractions', 
    description: 'Places to visit and explore',
    color: 'text-blue-700'
  },
  restaurant: { 
    title: '🍽️ Restaurants', 
    description: 'Dining options for your group',
    color: 'text-yellow-700'
  },
  transport: { 
    title: '🚗 Transportation', 
    description: 'Getting around your destination',
    color: 'text-purple-700'
  },
  accommodation: { 
    title: '🏨 Accommodations', 
    description: 'Places to stay',
    color: 'text-green-700'
  }
};

export default function CategoryView({
  recommendations,
  onAddToDay,
  onToggleFavorite,
  favorites = new Set()
}: CategoryViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['attraction', 'restaurant'])
  );

  // Group recommendations by category
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = [];
    }
    acc[rec.category].push(rec);
    return acc;
  }, {} as Record<string, RecommendationData[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const hasRecommendations = recommendations.length > 0;

  if (!hasRecommendations) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Ask me about your travel destination to see recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(categoryLabels).map(([category, config]) => {
        const categoryRecs = groupedRecommendations[category] || [];
        const isExpanded = expandedCategories.has(category);
        
        if (categoryRecs.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            {/* Category Header - Modern Style */}
            <div className="flex items-center justify-between border-b border-[rgb(var(--border-light))] pb-4">
              <div>
                <h3 className="text-2xl font-semibold flexitrip-text-primary mb-1">
                  {config.title}
                </h3>
                <p className="text-sm flexitrip-text-secondary">{config.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-[rgb(var(--background-blue-light))] rounded-full border border-[rgb(var(--border-light))]">
                  <span className="text-sm font-medium text-[rgb(var(--primary-brand))]">
                    {categoryRecs.length} {categoryRecs.length === 1 ? 'option' : 'options'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCategory(category)}
                  className="px-4 py-2 text-sm font-medium flexitrip-text-secondary hover:text-[rgb(var(--primary-brand))] transition-colors duration-200"
                >
                  {isExpanded ? 'Show less' : 'Show all'}
                </button>
              </div>
            </div>

            {/* Category Content - Modern Grid Layout */}
            {isExpanded && (
              <ModernGrid columns={{ default: 1, sm: 2, md: 3, lg: 4 }} gap="md">
                {categoryRecs.map((recommendation) => (
                  <ModernCard
                    key={recommendation.id}
                    id={recommendation.id}
                    title={recommendation.title}
                    description={recommendation.description}
                    rating={recommendation.rating}
                    duration={recommendation.duration}
                    price={recommendation.price}
                    location={recommendation.location}
                    category={recommendation.category}
                    ageGroup={recommendation.ageGroup}
                    accessibility={recommendation.accessibility}
                    onAddToDay={() => onAddToDay?.(recommendation)}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favorites.has(recommendation.id)}
                    isInItinerary={false} // This will be handled by parent component
                  />
                ))}
              </ModernGrid>
            )}

            {/* Show More Button for Large Categories */}
            {isExpanded && categoryRecs.length > 6 && (
              <div className="text-center">
                <button className="flexitrip-button-ghost-secondary flexitrip-button-compact">
                  Show All ({categoryRecs.length}) {config.title.split(' ')[1]}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Actions */}
      {hasRecommendations && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Ready to plan your itinerary?</h4>
                <p className="text-sm text-muted-foreground">
                  Add your favorite recommendations to days and build your trip timeline.
                </p>
              </div>
              <button className="flexitrip-button-primary flexitrip-button-compact ml-4">
                View Day Planner
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}