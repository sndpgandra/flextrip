'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  Accessibility, 
  DollarSign,
  CalendarPlus,
  Heart
} from 'lucide-react';

export interface RecommendationData {
  id: string;
  title: string;
  category: 'attraction' | 'restaurant' | 'transport' | 'accommodation';
  rating?: number;
  duration?: string;
  ageGroup?: string[];
  accessibility?: string;
  price?: string;
  description: string;
  location?: string;
  dietaryOptions?: string[];
  suggestedDay?: number;
  suggestedTime?: string;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
}

interface RecommendationCardProps {
  recommendation: RecommendationData;
  onAddToDay?: (recommendation: RecommendationData) => void;
  onToggleFavorite?: (recommendationId: string) => void;
  isFavorite?: boolean;
}

const categoryConfig = {
  attraction: {
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    icon: '🏛️',
    label: 'Attraction'
  },
  restaurant: {
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    icon: '🍽️',
    label: 'Restaurant'
  },
  transport: {
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    icon: '🚗',
    label: 'Transport'
  },
  accommodation: {
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    icon: '🏨',
    label: 'Hotel'
  }
};

export default function RecommendationCard({
  recommendation,
  onAddToDay,
  onToggleFavorite,
  isFavorite = false
}: RecommendationCardProps) {
  const config = categoryConfig[recommendation.category];

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${config.color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
              {recommendation.location && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {recommendation.location}
                </div>
              )}
            </div>
          </div>
          {onToggleFavorite && (
            <button
              className="flexitrip-button-ghost-secondary flexitrip-button-icon"
              onClick={() => onToggleFavorite(recommendation.id)}
            >
              <Heart className={`h-3 w-3 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rating and Duration */}
        <div className="flex items-center space-x-4">
          {recommendation.rating && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm font-medium">{recommendation.rating}</span>
            </div>
          )}
          {recommendation.duration && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground">{recommendation.duration}</span>
            </div>
          )}
          {recommendation.price && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground">{recommendation.price}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2">{recommendation.description}</p>

        {/* Age Groups */}
        {recommendation.ageGroup && recommendation.ageGroup.length > 0 && (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {recommendation.ageGroup.map((age) => (
                <Badge key={age} variant="outline" className="text-xs">
                  {age}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Options (for restaurants) */}
        {recommendation.category === 'restaurant' && recommendation.dietaryOptions && (
          <div className="flex flex-wrap gap-1">
            {recommendation.dietaryOptions.slice(0, 3).map((diet) => (
              <Badge key={diet} variant="outline" className="text-xs bg-green-50">
                🥗 {diet}
              </Badge>
            ))}
            {recommendation.dietaryOptions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recommendation.dietaryOptions.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Accessibility */}
        {recommendation.accessibility && (
          <div className="flex items-center">
            <Accessibility className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{recommendation.accessibility}</span>
          </div>
        )}

        {/* Action Button */}
        {onAddToDay && (
          <div className="pt-2">
            <button
              onClick={() => onAddToDay(recommendation)}
              className="flexitrip-button-ghost-secondary flexitrip-button-compact w-full"
            >
              <CalendarPlus className="h-3 w-3 mr-2" />
              Add to Day
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}