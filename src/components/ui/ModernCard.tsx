'use client';

import { useState } from 'react';
import { Heart, Star, MapPin, Clock, DollarSign, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  rating?: number;
  duration?: string;
  price?: string;
  location?: string;
  category?: 'attraction' | 'restaurant' | 'transport' | 'accommodation';
  ageGroup?: string[];
  accessibility?: string;
  onAddToDay?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  isInItinerary?: boolean;
  className?: string;
}

export default function ModernCard({
  id,
  title,
  description,
  imageUrl,
  rating,
  duration,
  price,
  location,
  category = 'attraction',
  ageGroup = [],
  accessibility,
  onAddToDay,
  onToggleFavorite,
  isFavorite = false,
  isInItinerary = false,
  className = ''
}: ModernCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getCategoryIcon = () => {
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'transport':
        return '🚗';
      case 'accommodation':
        return '🏨';
      default:
        return '🎯';
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'restaurant':
        return 'bg-[rgb(var(--accent-violet-light))]/20 text-[rgb(var(--accent-violet-dark))]';
      case 'transport':
        return 'bg-[rgb(var(--primary-light))]/20 text-[rgb(var(--primary-dark))]';
      case 'accommodation':
        return 'bg-[rgb(var(--accent-violet))]/20 text-[rgb(var(--accent-violet-dark))]';
      default:
        return 'bg-[rgb(var(--background-blue-light))] text-[rgb(var(--primary-brand))]';
    }
  };

  const handleAddToDay = () => {
    onAddToDay?.(id);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(id);
  };

  return (
    <div className={`group relative flexitrip-card rounded-xl overflow-hidden transition-all duration-300 ${className}`}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            <img
              src={imageUrl}
              alt={title}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">{getCategoryIcon()}</span>
          </div>
        )}
        
        {/* Overlay Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor()}`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {title}
          </h3>
          {rating && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">{rating}</span>
            </div>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center space-x-1 mb-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-600 line-clamp-1">{location}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            {duration && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{duration}</span>
              </div>
            )}
            {price && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Age Groups */}
        {ageGroup.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {ageGroup.map((age, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-[rgb(var(--background-blue-light))] text-[rgb(var(--primary-brand))] text-xs rounded-full border border-[rgb(var(--primary-light))]/30"
              >
                {age}
              </span>
            ))}
          </div>
        )}

        {/* Accessibility */}
        {accessibility && (
          <div className="text-xs text-[rgb(var(--accent-violet))] mb-3">
            ♿ {accessibility}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleAddToDay}
          disabled={isInItinerary}
          className={`w-full transition-all duration-200 font-semibold ${
            isInItinerary
              ? 'flexitrip-button-violet cursor-default opacity-75'
              : 'flexitrip-button-primary hover:scale-[1.02]'
          }`}
        >
          {isInItinerary ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added to Day
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add to Day
            </>
          )}
        </Button>
      </div>
    </div>
  );
}