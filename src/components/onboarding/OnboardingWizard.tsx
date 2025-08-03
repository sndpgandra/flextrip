'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Users, CheckCircle } from 'lucide-react';
import type { Traveler, OnboardingData } from '@/types';
import { RELATIONSHIP_OPTIONS, INTEREST_OPTIONS, CULTURAL_OPTIONS, DIETARY_OPTIONS } from '@/types';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    traveler_count: 1,
    travelers: [],
    cultural_preferences: [],
    completed: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize session when component mounts
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/session');
      const result = await response.json();
      
      if (result.success) {
        setSessionId(result.data.sessionId);
      } else {
        setError('Failed to initialize session');
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      setError('Failed to connect to server');
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'traveler_count',
      title: 'How many people are traveling?',
      description: 'Tell us about your travel group size (1-8 people maximum)',
      component: TravelerCountStep,
    },
    {
      id: 'traveler_details',
      title: 'Tell us about your travelers',
      description: 'We\'ll ask age-appropriate questions for each person',
      component: TravelerDetailsStep,
    },
    {
      id: 'preferences',
      title: 'Cultural & dietary preferences',
      description: 'Help us recommend the perfect experiences for your family',
      component: PreferencesStep,
    },
    {
      id: 'review',
      title: 'Review your family profile',
      description: 'Make sure everything looks good before we start planning',
      component: ReviewStep,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save all travelers to the database
      const savePromises = onboardingData.travelers.map(async (traveler) => {
        const response = await fetch('/api/travelers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...traveler,
            session_id: sessionId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save traveler');
        }
        
        return response.json();
      });

      await Promise.all(savePromises);
      
      setOnboardingData(prev => ({ ...prev, completed: true }));
      
      // Redirect to chat interface
      router.push('/chat');
      
    } catch (error) {
      console.error('Error saving travelers:', error);
      setError('Failed to save your family profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-bold">Family Profile Setup</h1>
        </div>
        <p className="text-muted-foreground">
          Help us understand your family so we can plan the perfect trip for everyone
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={onboardingData}
            onDataChange={setOnboardingData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            sessionId={sessionId}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleComplete}
            disabled={isLoading || !sessionId}
            className="flex items-center"
          >
            {isLoading ? 'Saving...' : 'Complete Setup'}
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );

  function canProceed(): boolean {
    switch (currentStep) {
      case 0:
        return onboardingData.traveler_count >= 1 && onboardingData.traveler_count <= 8;
      case 1:
        return onboardingData.travelers.length === onboardingData.traveler_count &&
               onboardingData.travelers.every(t => t.name && t.age);
      case 2:
        return true; // Preferences are optional
      case 3:
        return true; // Review step
      default:
        return false;
    }
  }
}

// Step Components
function TravelerCountStep({ data, onDataChange }: any) {
  const handleCountChange = (value: string) => {
    const count = parseInt(value, 10);
    onDataChange((prev: OnboardingData) => ({
      ...prev,
      traveler_count: count,
      travelers: Array(count).fill(null).map((_, index) => ({
        name: '',
        age: 0,
        mobility: 'high' as const,
        relationship: index === 0 ? 'myself' : '',
        interests: [],
        cultural_background: '',
        dietary_restrictions: [],
      })),
    }));
  };

  return (
    <div className="space-y-4">
      <Select value={data.traveler_count.toString()} onValueChange={handleCountChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select number of travelers" />
        </SelectTrigger>
        <SelectContent>
          {[1,2,3,4,5,6,7,8].map(num => (
            <SelectItem key={num} value={num.toString()}>
              {num} {num === 1 ? 'person' : 'people'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-sm text-muted-foreground">
        We can plan for up to 8 people to ensure everyone gets personalized recommendations.
      </p>
    </div>
  );
}

function TravelerDetailsStep({ data, onDataChange }: any) {
  const updateTraveler = (index: number, field: string, value: any) => {
    onDataChange((prev: OnboardingData) => ({
      ...prev,
      travelers: prev.travelers.map((traveler, i) => 
        i === index ? { ...traveler, [field]: value } : traveler
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {data.travelers.map((traveler: any, index: number) => (
        <TravelerForm
          key={index}
          traveler={traveler}
          index={index}
          onUpdate={updateTraveler}
        />
      ))}
    </div>
  );
}

function TravelerForm({ traveler, index, onUpdate }: any) {
  const showMobilityQuestion = traveler.age >= 50;
  const showInterestsQuestion = traveler.age >= 5 && traveler.age <= 16;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Person {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={traveler.name}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Age</label>
            <Input
              type="number"
              min="1"
              max="120"
              value={traveler.age || ''}
              onChange={(e) => onUpdate(index, 'age', parseInt(e.target.value, 10))}
              placeholder="Age"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Relationship to you</label>
          <Select 
            value={traveler.relationship} 
            onValueChange={(value) => onUpdate(index, 'relationship', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showMobilityQuestion && (
          <div>
            <label className="text-sm font-medium mb-2 block">Mobility level</label>
            <Select 
              value={traveler.mobility} 
              onValueChange={(value) => onUpdate(index, 'mobility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High - walks easily, no limitations</SelectItem>
                <SelectItem value="medium">Medium - moderate walking distances</SelectItem>
                <SelectItem value="low">Low - limited walking, needs accessible venues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showInterestsQuestion && (
          <div>
            <label className="text-sm font-medium mb-2 block">Interests (select all that apply)</label>
            <div className="grid grid-cols-3 gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <label key={interest} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={traveler.interests?.includes(interest) || false}
                    onChange={(e) => {
                      const current = traveler.interests || [];
                      const updated = e.target.checked
                        ? [...current, interest]
                        : current.filter((i: string) => i !== interest);
                      onUpdate(index, 'interests', updated);
                    }}
                  />
                  <span>{interest.charAt(0).toUpperCase() + interest.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreferencesStep({ data, onDataChange }: any) {
  const updatePreferences = (field: string, value: any) => {
    onDataChange((prev: OnboardingData) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-3 block">Cultural background (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {CULTURAL_OPTIONS.map(culture => (
            <label key={culture} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={data.cultural_preferences?.includes(culture) || false}
                onChange={(e) => {
                  const current = data.cultural_preferences || [];
                  const updated = e.target.checked
                    ? [...current, culture]
                    : current.filter((c: string) => c !== culture);
                  updatePreferences('cultural_preferences', updated);
                }}
              />
              <span>{culture.charAt(0).toUpperCase() + culture.slice(1).replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">Dietary restrictions (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {DIETARY_OPTIONS.map(dietary => (
            <label key={dietary} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={data.travelers.some((t: any) => t.dietary_restrictions?.includes(dietary))}
                onChange={(e) => {
                  // This is simplified - in a real app you might want to assign dietary restrictions per person
                  const updatedTravelers = data.travelers.map((traveler: any) => {
                    const current = traveler.dietary_restrictions || [];
                    const updated = e.target.checked
                      ? [...current, dietary]
                      : current.filter((d: string) => d !== dietary);
                    return { ...traveler, dietary_restrictions: updated };
                  });
                  onDataChange((prev: OnboardingData) => ({
                    ...prev,
                    travelers: updatedTravelers,
                  }));
                }}
              />
              <span>{dietary.charAt(0).toUpperCase() + dietary.slice(1).replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Your Travel Group ({data.traveler_count} people)</h3>
        <div className="space-y-3">
          {data.travelers.map((traveler: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{traveler.name}, {traveler.age} years old</p>
                    <p className="text-sm text-muted-foreground">
                      {traveler.relationship?.charAt(0).toUpperCase() + traveler.relationship?.slice(1)}
                      {traveler.mobility !== 'high' && ` • ${traveler.mobility} mobility`}
                    </p>
                    {traveler.interests?.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Interests: {traveler.interests.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {data.cultural_preferences?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Cultural Preferences</h3>
          <p className="text-sm text-muted-foreground">
            {data.cultural_preferences.join(', ')}
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm">
          <strong>Next:</strong> We'll use this information to provide personalized travel recommendations 
          that work for your entire family. You can always update your profile later.
        </p>
      </div>
    </div>
  );
}