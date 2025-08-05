'use client';

import React from 'react';
import { Plus, MapPin, Ticket, Calendar, Users, Star, Edit, Trash2, Save, Share2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

// Sticky Button Component - appears after chat completion
export function StickyButton({ children, onClick, icon, ...props }: ButtonProps) {
  return (
    <button
      className="flexitrip-button-sticky"
      onClick={onClick}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Floating Button Component - for pages
export function FloatingButton({ onClick, icon = <Plus className="h-6 w-6" />, ...props }: ButtonProps) {
  return (
    <button
      className="flexitrip-button-floating"
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );
}

// Ghost Secondary Button - for actions like "Add Activity", "Edit"
export function GhostSecondaryButton({ children, onClick, icon, ...props }: ButtonProps) {
  return (
    <button
      className="flexitrip-button-ghost-secondary"
      onClick={onClick}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Filter Button with Icon + Text
export function FilterButton({ 
  children, 
  onClick, 
  icon, 
  active = false, 
  ...props 
}: ButtonProps & { active?: boolean }) {
  return (
    <button
      className={`flexitrip-button-filter ${active ? 'active' : ''}`}
      onClick={onClick}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// Example usage component showing all button types
export function ButtonShowcase() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Primary Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button className="flexitrip-button-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Trip
          </button>
          <button className="flexitrip-button-violet">
            <Share2 className="h-4 w-4 mr-2" />
            Share Itinerary
          </button>
          <button className="flexitrip-button-modern">
            <Star className="h-4 w-4 mr-2" />
            Premium Features
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Secondary Actions</h3>
        <div className="flex flex-wrap gap-3">
          <GhostSecondaryButton icon={<Plus className="h-4 w-4" />}>
            Add Activity
          </GhostSecondaryButton>
          <GhostSecondaryButton icon={<Edit className="h-4 w-4" />}>
            Edit Trip
          </GhostSecondaryButton>
          <GhostSecondaryButton icon={<Trash2 className="h-4 w-4" />}>
            Delete
          </GhostSecondaryButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Filter Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <FilterButton icon="📍" active>
            Location
          </FilterButton>
          <FilterButton icon="🎟️">
            Tickets
          </FilterButton>
          <FilterButton icon="📅">
            Date
          </FilterButton>
          <FilterButton icon="👥">
            Group Size
          </FilterButton>
          <FilterButton icon="⭐">
            Rating
          </FilterButton>
          <FilterButton icon="💰">
            Price
          </FilterButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Button Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <button className="flexitrip-button-primary flexitrip-button-compact">
            Compact
          </button>
          <button className="flexitrip-button-primary">
            Default
          </button>
          <button className="flexitrip-button-primary flexitrip-button-large">
            Large Action
          </button>
        </div>
      </div>

      {/* Examples of floating elements */}
      <StickyButton icon={<Save className="h-5 w-5" />}>
        Save Progress
      </StickyButton>
      
      <FloatingButton />
    </div>
  );
}

export default ButtonShowcase;