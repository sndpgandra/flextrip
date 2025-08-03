'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6">
      {Object.entries(categoryLabels).map(([category, config]) => {
        const categoryRecs = groupedRecommendations[category] || [];
        const isExpanded = expandedCategories.has(category);
        
        if (categoryRecs.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-semibold ${config.color}`}>
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {categoryRecs.length} {categoryRecs.length === 1 ? 'option' : 'options'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>

            {/* Category Content */}
            {isExpanded && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryRecs.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onAddToDay={onAddToDay}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favorites.has(recommendation.id)}
                  />
                ))}
              </div>
            )}

            {/* Show More Button for Large Categories */}
            {isExpanded && categoryRecs.length > 6 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  Show All ({categoryRecs.length}) {config.title.split(' ')[1]}
                </Button>
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
              <Button size="sm" className="ml-4">
                View Day Planner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}