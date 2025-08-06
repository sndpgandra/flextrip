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
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => onViewChange('category')}
              className={`flexitrip-button-filter flexitrip-button-compact ${currentView === 'category' ? 'active' : ''}`}
            >
              <LayoutGrid className="h-3 w-3" />
              <span>Category View</span>
            </button>
            <button
              onClick={() => onViewChange('day')}
              className={`flexitrip-button-filter flexitrip-button-compact ${currentView === 'day' ? 'active' : ''} ${!hasRecommendations ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!hasRecommendations}
            >
              <Calendar className="h-3 w-3" />
              <span>Day View</span>
            </button>
          </div>

          {/* Action Buttons */}
          {hasRecommendations && (
            <div className="flex items-center space-x-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className="flexitrip-button-ghost-secondary flexitrip-button-compact flex items-center space-x-1"
                >
                  <Save className="h-3 w-3" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
              {onExport && (
                <button
                  onClick={onExport}
                  className="flexitrip-button-ghost-secondary flexitrip-button-compact flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="flexitrip-button-ghost-secondary flexitrip-button-compact flex items-center space-x-1"
                >
                  <Share2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Share</span>
                </button>
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