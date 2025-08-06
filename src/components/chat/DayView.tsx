'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Clock, 
  MapPin, 
  MoreVertical,
  Sunrise,
  Sun,
  Sunset,
  Calendar
} from 'lucide-react';
import { RecommendationData } from './RecommendationCard';

interface DayViewProps {
  recommendations: RecommendationData[];
  onAddToDay?: (recommendation: RecommendationData) => void;
  onRemoveFromDay?: (recommendationId: string) => void;
}

interface TimeSlot {
  id: string;
  name: string;
  time: string;
  icon: React.ReactNode;
  recommendations: RecommendationData[];
  color: string;
}

// Mock data structure for day planning
const mockDayData: TimeSlot[] = [
  {
    id: 'morning',
    name: 'Morning',
    time: '9AM - 12PM',
    icon: <Sunrise className="h-5 w-5" />,
    recommendations: [],
    color: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'afternoon',
    name: 'Afternoon', 
    time: '1PM - 5PM',
    icon: <Sun className="h-5 w-5" />,
    recommendations: [],
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'evening',
    name: 'Evening',
    time: '6PM - 9PM', 
    icon: <Sunset className="h-5 w-5" />,
    recommendations: [],
    color: 'bg-purple-50 border-purple-200'
  }
];

export default function DayView({
  recommendations,
  onAddToDay,
  onRemoveFromDay
}: DayViewProps) {
  const hasRecommendations = recommendations.length > 0;
  console.log('DayView received recommendations:', recommendations.length);

  // Group recommendations by time slot
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const timeSlot = rec.timeSlot || 'afternoon'; // default to afternoon if no timeSlot
    if (!acc[timeSlot]) {
      acc[timeSlot] = [];
    }
    acc[timeSlot].push(rec);
    return acc;
  }, {} as Record<string, RecommendationData[]>);

  console.log('Grouped recommendations:', groupedRecommendations);

  // Create time slots with actual recommendations
  const timeSlots: TimeSlot[] = mockDayData.map(slot => ({
    ...slot,
    recommendations: groupedRecommendations[slot.id] || []
  }));

  if (!hasRecommendations) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-2">No Itinerary Yet</h3>
        <p className="text-muted-foreground mb-4">
          Switch to Category View to browse recommendations,<br />
          then add them to your daily itinerary.
        </p>
        <button className="flexitrip-button-ghost-secondary flexitrip-button-compact">
          Browse Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Day 1</h2>
          <p className="text-muted-foreground">Your travel itinerary</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flexitrip-button-ghost-secondary flexitrip-button-compact">
            <Plus className="h-3 w-3 mr-1" />
            Add Day
          </button>
          <button className="flexitrip-button-ghost-secondary flexitrip-button-icon">
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Time Slots */}
      <div className="grid gap-4">
        {timeSlots.map((timeSlot) => (
          <Card key={timeSlot.id} className={`${timeSlot.color} transition-all hover:shadow-md`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {timeSlot.icon}
                  <div>
                    <CardTitle className="text-lg">{timeSlot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{timeSlot.time}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {timeSlot.recommendations.length} activities
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {timeSlot.recommendations.length === 0 ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop recommendations here or click to add activities
                  </p>
                  <button className="flexitrip-button-ghost-secondary flexitrip-button-compact mt-2">
                    Add Activity
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeSlot.recommendations.map((rec) => (
                    <Card key={rec.id} className="bg-white shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{rec.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              {rec.duration && (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {rec.duration}
                                </>
                              )}
                              {rec.location && (
                                <>
                                  <MapPin className="h-3 w-3 ml-3 mr-1" />
                                  {rec.location}
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            className="flexitrip-button-ghost-secondary flexitrip-button-compact"
                            onClick={() => onRemoveFromDay?.(rec.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Day Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <h4 className="font-medium mb-2">Day Planning Coming Soon!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Drag-and-drop itinerary building, time optimization, and multi-day planning will be available in the next update.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button className="flexitrip-button-ghost-secondary flexitrip-button-compact">
                Add Another Day
              </button>
              <button className="flexitrip-button-ghost-secondary flexitrip-button-compact">
                Optimize Schedule
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}