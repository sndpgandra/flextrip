'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutGrid, 
  Calendar, 
  Save, 
  Download, 
  Share2 
} from 'lucide-react';

export type ViewMode = 'category' | 'day';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  hasRecommendations?: boolean;
}

export default function ViewToggle({
  currentView,
  onViewChange,
  onSave,
  onExport,
  onShare,
  hasRecommendations = false
}: ViewToggleProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          {/* View Toggle Buttons */}
          <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={currentView === 'category' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('category')}
              className="flex items-center space-x-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Category View</span>
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('day')}
              className="flex items-center space-x-2"
              disabled={!hasRecommendations}
            >
              <Calendar className="h-4 w-4" />
              <span>Day View</span>
            </Button>
          </div>

          {/* Action Buttons */}
          {hasRecommendations && (
            <div className="flex items-center space-x-2">
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  className="flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="flex items-center space-x-1"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* View Descriptions */}
        <div className="mt-3 text-sm text-muted-foreground">
          {currentView === 'category' ? (
            <p>Browse recommendations organized by type - attractions, restaurants, and transport options.</p>
          ) : (
            <p>Plan your trip timeline with recommendations organized by days and time slots.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}