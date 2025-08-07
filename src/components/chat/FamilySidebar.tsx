'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Settings,
  Save,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  UtensilsCrossed,
  Sparkles,
  MessageSquare,
  Loader2
} from 'lucide-react';
import type { Traveler } from '@/types';
import { RELATIONSHIP_OPTIONS, INTEREST_OPTIONS, CULTURAL_OPTIONS, DIETARY_OPTIONS } from '@/types';
import { generateBasePrompt, generateQuickPrompts, hasValidSelections } from '@/lib/utils/prompt-generator';

interface TravelPreferences {
  destination: string;
  checkIn: string;
  checkOut: string;
  budget: string;
  tripType: string[];
}

interface CulturalSettings {
  culturalBackground: string[];
  dietaryRestrictions: string[];
  familyInterests: string[];
}

interface FamilySidebarProps {
  travelers: Traveler[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddTraveler: () => void;
  onEditTraveler: (traveler: Traveler) => void;
  onRemoveTraveler: (travelerId: string) => void;
  onNewTrip: () => void;
  currentTripTitle?: string;
  travelPreferences: TravelPreferences;
  onTravelPreferencesChange: (preferences: TravelPreferences) => void;
  culturalSettings: CulturalSettings;
  onCulturalSettingsChange: (settings: CulturalSettings) => void;
  travelContext: any;
  onUpdateContext: (updates: {
    newTravelers?: any[];
    updatedTravelers?: Traveler[];
    removedTravelerIds?: string[];
  }) => void;
  onPromptGenerated?: (prompt: string) => void;
  sessionId?: string;
}

export default function FamilySidebar({
  travelers,
  isCollapsed,
  onToggleCollapse,
  onAddTraveler,
  onEditTraveler,
  onRemoveTraveler,
  onNewTrip,
  currentTripTitle,
  travelPreferences,
  onTravelPreferencesChange,
  culturalSettings,
  onCulturalSettingsChange,
  travelContext,
  onUpdateContext,
  onPromptGenerated,
  sessionId
}: FamilySidebarProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<string | null>(null);
  
  // New sidebar sections state
  const [expandedSections, setExpandedSections] = useState({
    family: true,
    preferences: true,
    cultural: false,
    promptGeneration: false,
    tripManagement: false
  });

  // Local state for pending changes (not yet applied)
  const [pendingTravelers, setPendingTravelers] = useState<any[]>([]);
  const [removedTravelerIds, setRemovedTravelerIds] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Prompt generation state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState<'general' | 'activities' | 'dining' | 'accommodation' | 'transportation'>('general');

  // Form state for new traveler
  const [newTraveler, setNewTraveler] = useState<{
    name: string;
    age: string;
    relationship: string;
    mobility: 'high' | 'medium' | 'low';
    interests: string[];
    dietary_restrictions: string[];
  }>({
    name: '',
    age: '',
    relationship: '',
    mobility: 'high',
    interests: [],
    dietary_restrictions: []
  });

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

  // Toggle section expand/collapse
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle adding traveler to pending list (no API call yet)
  const handleAddTravelerToPending = () => {
    if (!newTraveler.name.trim() || !newTraveler.age) return;

    const newTravelerData = {
      ...newTraveler,
      age: parseInt(newTraveler.age),
      id: `pending_${Date.now()}`, // Temporary ID
      isNew: true
    };

    setPendingTravelers(prev => [...prev, newTravelerData]);
    setHasUnsavedChanges(true);

    // Reset form and close
    setNewTraveler({
      name: '',
      age: '',
      relationship: '',
      mobility: 'high',
      interests: [],
      dietary_restrictions: []
    });
    setShowAddForm(false);
  };

  // Handle interest toggle
  const toggleInterest = (interest: string, isNew: boolean = true) => {
    if (isNew) {
      setNewTraveler(prev => ({
        ...prev,
        interests: prev.interests.includes(interest)
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      }));
    }
  };

  // Handle travel preference changes
  const updateTravelPreference = (key: string, value: any) => {
    onTravelPreferencesChange({
      ...travelPreferences,
      [key]: value
    });
  };

  // Handle cultural setting changes
  const updateCulturalSetting = (key: string, value: any) => {
    onCulturalSettingsChange({
      ...culturalSettings,
      [key]: value
    });
    setHasUnsavedChanges(true);
  };

  // Handle removing traveler (existing travelers marked for removal, pending ones deleted immediately)
  const handleDeleteConfirm = (travelerId: string) => {
    if (travelerId.startsWith('pending_')) {
      // Remove from pending list immediately
      setPendingTravelers(prev => prev.filter(t => t.id !== travelerId));
    } else {
      // Mark existing traveler for removal
      setRemovedTravelerIds(prev => [...prev, travelerId]);
    }
    setHasUnsavedChanges(true);
    setShowConfirmDelete(null);
  };

  // Handle removing traveler from pending removal list
  const handleUndoRemove = (travelerId: string) => {
    setRemovedTravelerIds(prev => prev.filter(id => id !== travelerId));
    setHasUnsavedChanges(true);
  };

  // Apply all pending changes
  const handleUpdateContext = async () => {
    if (!hasUnsavedChanges) return;

    try {
      // Call the parent's update function with all changes
      onUpdateContext({
        newTravelers: pendingTravelers,
        removedTravelerIds: removedTravelerIds
      });

      // Clear local state after successful update
      setPendingTravelers([]);
      setRemovedTravelerIds([]);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating context:', error);
      alert('Failed to update context. Please try again.');
    }
  };

  // Get combined list of travelers (existing + pending - removed)
  const getAllTravelers = () => {
    const existingTravelers = travelers.filter(t => !removedTravelerIds.includes(t.id));
    return [...existingTravelers, ...pendingTravelers];
  };

  // Generate and enhance prompt
  const handleGeneratePrompt = async () => {
    if (!onPromptGenerated || !sessionId) return;
    
    const allTravelers = getAllTravelers();
    const options = {
      travelers: allTravelers,
      travelPreferences,
      culturalSettings,
      focusType: selectedPromptType
    };

    if (!hasValidSelections(options)) {
      alert('Please add family members or destination to generate a travel prompt.');
      return;
    }

    setIsEnhancing(true);
    try {
      // Generate base prompt
      const basePrompt = generateBasePrompt(options);
      
      // Enhance with LLM
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basePrompt,
          travelContext: travelContext.contextPrompt,
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const result = await response.json();
      if (result.success) {
        // Send enhanced prompt to chat input
        onPromptGenerated(result.data.enhancedPrompt);
      } else {
        // Fallback to base prompt if enhancement fails
        onPromptGenerated(basePrompt);
      }
    } catch (error) {
      console.error('Prompt generation error:', error);
      // Fallback to base prompt
      const basePrompt = generateBasePrompt(options);
      onPromptGenerated(basePrompt);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Check if prompt generation is available
  const canGeneratePrompt = () => {
    const allTravelers = getAllTravelers();
    return hasValidSelections({
      travelers: allTravelers,
      travelPreferences,
      culturalSettings
    });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-background border-r p-2 flex flex-col items-center">
        <button 
          onClick={onToggleCollapse}
          className="flexitrip-button-ghost flexitrip-button-icon mb-4"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <div className="flex flex-col items-center space-y-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{travelers.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border-r flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-primary mr-2" />
          <h2 className="font-semibold">FlexiTrip Planner</h2>
        </div>
        <button onClick={onToggleCollapse} className="flexitrip-button-ghost flexitrip-button-icon">
          <ChevronLeft className="h-3 w-3" />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Section 1: Family Group */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('family')}
            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Users className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">Family Group</span>
              <Badge variant="outline" className="ml-2">
                {getAllTravelers().length}
              </Badge>
            </div>
            {expandedSections.family ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.family && (
            <div className="p-4 pt-0 space-y-3">
              {/* Add Traveler Button */}
              <button 
                onClick={() => setShowAddForm(true)}
                className="flexitrip-button-primary flexitrip-button-compact w-full"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Family Member
              </button>

              {/* Add Traveler Form */}
              {showAddForm && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Add Family Member</h4>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="flexitrip-button-ghost-secondary flexitrip-button-icon"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Name"
                        value={newTraveler.name}
                        onChange={(e) => setNewTraveler(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Age"
                        min="1"
                        max="120"
                        value={newTraveler.age}
                        onChange={(e) => setNewTraveler(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>

                    <Select 
                      value={newTraveler.relationship} 
                      onValueChange={(value) => setNewTraveler(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {parseInt(newTraveler.age) >= 50 && (
                      <Select 
                        value={newTraveler.mobility} 
                        onValueChange={(value: 'high' | 'medium' | 'low') => setNewTraveler(prev => ({ ...prev, mobility: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High - walks easily</SelectItem>
                          <SelectItem value="medium">Medium - moderate walking</SelectItem>
                          <SelectItem value="low">Low - limited walking</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {parseInt(newTraveler.age) >= 5 && parseInt(newTraveler.age) <= 16 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Interests (optional)</p>
                        <div className="grid grid-cols-3 gap-1">
                          {INTEREST_OPTIONS.map(interest => (
                            <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`text-xs p-1 rounded transition-colors ${
                                newTraveler.interests.includes(interest)
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddTravelerToPending}
                        disabled={!newTraveler.name.trim() || !newTraveler.age}
                        className="flexitrip-button-primary flexitrip-button-compact flex-1 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to List
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="flexitrip-button-ghost-secondary flexitrip-button-compact"
                      >
                        Cancel
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Travelers List */}
              {getAllTravelers().length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-4 pb-4 text-center">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Add family members to get personalized recommendations
                    </p>
                  </CardContent>
                </Card>
              ) : (
                getAllTravelers().map((traveler) => {
                  const isPending = traveler.id.startsWith('pending_');
                  const isRemoved = removedTravelerIds.includes(traveler.id);
                  
                  return (
                    <Card key={traveler.id} className={`relative text-sm ${isPending ? 'border-green-200 bg-green-50' : ''} ${isRemoved ? 'border-red-200 bg-red-50 opacity-60' : ''}`}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{traveler.name}</h4>
                              {isPending && <Badge className="text-xs bg-green-500 text-white">New</Badge>}
                              {isRemoved && (
                                <>
                                  <Badge className="text-xs bg-red-500 text-white">Removed</Badge>
                                  <button
                                    onClick={() => handleUndoRemove(traveler.id)}
                                    className="text-xs text-blue-600 hover:underline ml-1"
                                  >
                                    Undo
                                  </button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {traveler.age} years old
                              {traveler.relationship && ` • ${traveler.relationship}`}
                            </p>
                          </div>
                          {!isRemoved && (
                            <div className="flex space-x-1">
                              <button
                                className="flexitrip-button-ghost-secondary flexitrip-button-icon"
                                onClick={() => onEditTraveler(traveler)}
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                className="flexitrip-button-ghost-secondary flexitrip-button-icon text-red-500 hover:text-white hover:bg-red-500"
                                onClick={() => setShowConfirmDelete(traveler.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className={`${getCategoryColor(traveler.age)} text-xs`}>
                            {getAgeCategory(traveler.age)}
                          </Badge>
                          {traveler.mobility !== 'high' && (
                            <Badge className={`${getMobilityColor(traveler.mobility)} text-xs`}>
                              {traveler.mobility} mobility
                            </Badge>
                          )}
                        </div>

                        {traveler.interests && traveler.interests.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Interests:</p>
                            <div className="flex flex-wrap gap-1">
                              {traveler.interests.slice(0, 2).map((interest: string) => (
                                <Badge key={interest} variant="outline" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {traveler.interests.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{traveler.interests.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Delete Confirmation */}
                        {showConfirmDelete === traveler.id && (
                          <div className="absolute inset-0 bg-background/95 flex items-center justify-center rounded-lg">
                            <div className="text-center p-2">
                              <p className="text-sm mb-2">Remove {traveler.name}?</p>
                              <div className="flex space-x-2 justify-center">
                                <button
                                  className="flexitrip-button-compact bg-red-500 hover:bg-red-600 text-white border-0"
                                  onClick={() => handleDeleteConfirm(traveler.id)}
                                >
                                  Remove
                                </button>
                                <button
                                  className="flexitrip-button-ghost-secondary flexitrip-button-compact"
                                  onClick={() => setShowConfirmDelete(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Section 2: Travel Preferences */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('preferences')}
            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">Travel Preferences</span>
            </div>
            {expandedSections.preferences ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.preferences && (
            <div className="p-4 pt-0 space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Destination</label>
                <Input
                  placeholder="Where would you like to go?"
                  value={travelPreferences.destination}
                  onChange={(e) => updateTravelPreference('destination', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Check-in</label>
                  <Input
                    type="date"
                    value={travelPreferences.checkIn}
                    onChange={(e) => updateTravelPreference('checkIn', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Check-out</label>
                  <Input
                    type="date"
                    value={travelPreferences.checkOut}
                    onChange={(e) => updateTravelPreference('checkOut', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Budget Range</label>
                <div className="grid grid-cols-3 gap-1">
                  {['Budget', 'Moderate', 'Luxury'].map((budget) => (
                    <button
                      key={budget}
                      onClick={() => updateTravelPreference('budget', budget)}
                      className={`text-xs p-2 rounded transition-colors ${
                        travelPreferences.budget === budget
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {budget === 'Budget' ? '$' : budget === 'Moderate' ? '$$' : '$$$'} {budget}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Cultural Settings */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('cultural')}
            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">Cultural Settings</span>
            </div>
            {expandedSections.cultural ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.cultural && (
            <div className="p-4 pt-0 space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Cultural Background</label>
                <div className="grid grid-cols-2 gap-1">
                  {CULTURAL_OPTIONS.map(culture => (
                    <button
                      key={culture}
                      onClick={() => {
                        const current = culturalSettings.culturalBackground;
                        const updated = current.includes(culture)
                          ? current.filter(c => c !== culture)
                          : [...current, culture];
                        updateCulturalSetting('culturalBackground', updated);
                      }}
                      className={`text-xs p-2 rounded transition-colors ${
                        culturalSettings.culturalBackground.includes(culture)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {culture.charAt(0).toUpperCase() + culture.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dietary Restrictions</label>
                <div className="grid grid-cols-2 gap-1">
                  {DIETARY_OPTIONS.map(dietary => (
                    <button
                      key={dietary}
                      onClick={() => {
                        const current = culturalSettings.dietaryRestrictions;
                        const updated = current.includes(dietary)
                          ? current.filter(d => d !== dietary)
                          : [...current, dietary];
                        updateCulturalSetting('dietaryRestrictions', updated);
                      }}
                      className={`text-xs p-2 rounded transition-colors ${
                        culturalSettings.dietaryRestrictions.includes(dietary)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {dietary.charAt(0).toUpperCase() + dietary.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Generation Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('promptGeneration' as any)}
            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">AI Trip Planner</span>
              {canGeneratePrompt() && (
                <Badge className="ml-2 bg-green-100 text-green-800">
                  Ready
                </Badge>
              )}
            </div>
            {expandedSections.promptGeneration ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.promptGeneration && (
            <div className="p-4 pt-0 space-y-3">
              {canGeneratePrompt() ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Focus Area</label>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { value: 'general', label: 'General' },
                        { value: 'activities', label: 'Activities' },
                        { value: 'dining', label: 'Dining' },
                        { value: 'accommodation', label: 'Hotels' },
                        { value: 'transportation', label: 'Transport' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedPromptType(option.value as any)}
                          className={`text-xs p-2 rounded transition-colors ${
                            selectedPromptType === option.value
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGeneratePrompt}
                    disabled={isEnhancing}
                    className="flexitrip-button-primary w-full disabled:opacity-50"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Generate Trip Query
                      </>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Creates an AI-enhanced travel query based on your selections
                  </p>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-4 pb-4 text-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">
                      Add family members or destination to generate personalized travel queries
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Update Context Button - Only show when there are unsaved changes */}
        {hasUnsavedChanges && (
          <div className="p-4 border-b bg-blue-50 border-blue-200">
            <button
              onClick={handleUpdateContext}
              className="flexitrip-button-primary w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Update Context ({pendingTravelers.length + removedTravelerIds.length} changes)
            </button>
            <p className="text-xs text-blue-600 mt-2 text-center">
              Apply all family and preference changes to your travel context
            </p>
          </div>
        )}

        {/* Section 4: Trip Management */}
        <div>
          <button
            onClick={() => toggleSection('tripManagement')}
            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Settings className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">Trip Management</span>
            </div>
            {expandedSections.tripManagement ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.tripManagement && (
            <div className="p-4 pt-0 space-y-3">
              {currentTripTitle && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Current Trip</p>
                        <p className="text-xs text-blue-700">{currentTripTitle}</p>
                      </div>
                      <button 
                        onClick={onNewTrip}
                        className="flexitrip-button-ghost-secondary flexitrip-button-compact"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        New Trip
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="text-center text-xs text-muted-foreground">
                <p>Save your conversations and preferences</p>
                <p>for future trip planning</p>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}