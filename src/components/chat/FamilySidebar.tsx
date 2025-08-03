'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Settings
} from 'lucide-react';
import type { Traveler } from '@/types';

interface FamilySidebarProps {
  travelers: Traveler[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddTraveler: () => void;
  onEditTraveler: (traveler: Traveler) => void;
  onRemoveTraveler: (travelerId: string) => void;
  onNewTrip: () => void;
  currentTripTitle?: string;
}

export default function FamilySidebar({
  travelers,
  isCollapsed,
  onToggleCollapse,
  onAddTraveler,
  onEditTraveler,
  onRemoveTraveler,
  onNewTrip,
  currentTripTitle
}: FamilySidebarProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const getAgeCategory = (age: number): string => {
    if (age <= 5) return 'Toddler';
    if (age <= 12) return 'Child';
    if (age <= 17) return 'Teen';
    if (age >= 65) return 'Senior';
    return 'Adult';
  };

  const getCategoryColor = (age: number): string => {
    if (age <= 5) return 'bg-pink-100 text-pink-800';
    if (age <= 12) return 'bg-blue-100 text-blue-800';
    if (age <= 17) return 'bg-purple-100 text-purple-800';
    if (age >= 65) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMobilityColor = (mobility: string): string => {
    switch (mobility) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteConfirm = (travelerId: string) => {
    onRemoveTraveler(travelerId);
    setShowConfirmDelete(null);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-background border-r p-2 flex flex-col items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center space-y-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{travelers.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border-r p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-primary mr-2" />
          <h2 className="font-semibold">Family Group</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Trip Context */}
      {currentTripTitle && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Current Trip</p>
                <p className="text-xs text-blue-700">{currentTripTitle}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onNewTrip}
                className="text-blue-700 border-blue-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                New Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Traveler Button */}
      <Button onClick={onAddTraveler} className="mb-4 w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Family Member
      </Button>

      {/* Travelers List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {travelers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No family members added yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start by adding your travel companions!
              </p>
            </CardContent>
          </Card>
        ) : (
          travelers.map((traveler) => (
            <Card key={traveler.id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{traveler.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {traveler.age} years old
                      {traveler.relationship && ` • ${traveler.relationship}`}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onEditTraveler(traveler)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => setShowConfirmDelete(traveler.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className={getCategoryColor(traveler.age)}>
                    {getAgeCategory(traveler.age)}
                  </Badge>
                  {traveler.mobility !== 'high' && (
                    <Badge className={getMobilityColor(traveler.mobility)}>
                      {traveler.mobility} mobility
                    </Badge>
                  )}
                </div>

                {/* Interests */}
                {traveler.interests && traveler.interests.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {traveler.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {traveler.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{traveler.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Dietary Restrictions */}
                {traveler.dietary_restrictions && traveler.dietary_restrictions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dietary:</p>
                    <div className="flex flex-wrap gap-1">
                      {traveler.dietary_restrictions.slice(0, 2).map((diet) => (
                        <Badge key={diet} variant="outline" className="text-xs bg-green-50">
                          {diet.replace('_', ' ')}
                        </Badge>
                      ))}
                      {traveler.dietary_restrictions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{traveler.dietary_restrictions.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {showConfirmDelete === traveler.id && (
                  <div className="absolute inset-0 bg-background/95 flex items-center justify-center rounded-lg">
                    <div className="text-center p-4">
                      <p className="text-sm mb-3">Remove {traveler.name}?</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteConfirm(traveler.id)}
                        >
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowConfirmDelete(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{travelers.length} {travelers.length === 1 ? 'person' : 'people'}</span>
          <Button variant="ghost" size="sm">
            <Settings className="h-3 w-3 mr-1" />
            Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}