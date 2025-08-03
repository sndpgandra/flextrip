'use client';

import { Card, CardContent } from '@/components/ui/card';
import { User, Users } from 'lucide-react';
import type { Traveler } from '@/types';

interface TravelerContextBarProps {
  travelers: Traveler[];
}

export default function TravelerContextBar({ travelers }: TravelerContextBarProps) {
  if (travelers.length === 0) {
    return (
      <Card>
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">No travelers added yet</p>
        </CardContent>
      </Card>
    );
  }

  const getAgeCategory = (age: number): string => {
    if (age <= 5) return 'toddler';
    if (age <= 12) return 'child';
    if (age <= 17) return 'teen';
    if (age >= 65) return 'senior';
    return 'adult';
  };

  const getMobilityBadge = (mobility: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[mobility as keyof typeof colors]}`}>
        {mobility} mobility
      </span>
    );
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-sm font-medium">Your Travel Group</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {travelers.length} {travelers.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {travelers.map((traveler) => (
            <div
              key={traveler.id}
              className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2"
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{traveler.name}</span>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{traveler.age} years old</span>
                  <span>•</span>
                  <span className="capitalize">{getAgeCategory(traveler.age)}</span>
                  {traveler.mobility !== 'high' && (
                    <>
                      <span>•</span>
                      {getMobilityBadge(traveler.mobility)}
                    </>
                  )}
                </div>
                {traveler.interests && traveler.interests.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Interests: {traveler.interests.slice(0, 3).join(', ')}
                    {traveler.interests.length > 3 && '...'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Group characteristics summary */}
        <div className="mt-3 pt-2 border-t">
          <div className="flex flex-wrap gap-2 text-xs">
            {travelers.some(t => t.age <= 12) && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Child-friendly needed
              </span>
            )}
            {travelers.some(t => t.age >= 65) && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Senior-accessible
              </span>
            )}
            {travelers.some(t => t.mobility === 'low') && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Accessibility required
              </span>
            )}
            {travelers.some(t => t.dietary_restrictions && t.dietary_restrictions.length > 0) && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Dietary restrictions
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}