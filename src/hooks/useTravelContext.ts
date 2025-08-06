import { useMemo } from 'react';
import type { Traveler } from '@/types';

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

interface TravelContext {
  // From Family Group
  travelers: {
    adults: number;
    children: number;
    seniors: number;
    totalCount: number;
    ageRange: string;
    mobilityNeeds: string[];
    childrenAges: number[];
    adultInterests: string[];
    childrenInterests: string[];
    relationships: string[];
  };
  
  // From Travel Preferences  
  destination: string;
  dates: {
    checkin: string;
    checkout: string; 
    duration: string;
  };
  tripType: string[];
  budget: string;
  
  // From Cultural Settings
  culturalBackground: string[];
  dietaryRestrictions: string[];
  familyInterests: string[];
  
  // Generated insights
  recommendations: {
    needsChildFriendly: boolean;
    needsVegetarianOptions: boolean;
    needsAccessibility: boolean;
    focusAreas: string[];
    avoidAreas: string[];
  };
  
  // Context summary for LLM
  contextPrompt: string;
}

interface UseTravelContextProps {
  travelers: Traveler[];
  travelPreferences: TravelPreferences;
  culturalSettings: CulturalSettings;
}

export const useTravelContext = ({
  travelers,
  travelPreferences,
  culturalSettings
}: UseTravelContextProps): TravelContext => {
  
  const travelContext = useMemo(() => {
    // Analyze travelers
    const adults = travelers.filter(t => t.age >= 18 && t.age < 65).length;
    const children = travelers.filter(t => t.age < 18).length;
    const seniors = travelers.filter(t => t.age >= 65).length;
    const totalCount = travelers.length;
    
    const ages = travelers.map(t => t.age).sort((a, b) => a - b);
    const ageRange = ages.length > 0 ? `${ages[0]}-${ages[ages.length - 1]} years` : '';
    
    const childrenAges = travelers.filter(t => t.age < 18).map(t => t.age);
    const adultInterests = travelers
      .filter(t => t.age >= 18)
      .flatMap(t => t.interests || []);
    const childrenInterests = travelers
      .filter(t => t.age < 18)
      .flatMap(t => t.interests || []);
    
    const mobilityNeeds = travelers
      .filter(t => t.mobility !== 'high')
      .map(t => `${t.mobility} mobility`);
    
    const relationships = travelers
      .map(t => t.relationship)
      .filter(Boolean) as string[];
    
    // Calculate duration
    let duration = '';
    if (travelPreferences.checkIn && travelPreferences.checkOut) {
      const checkIn = new Date(travelPreferences.checkIn);
      const checkOut = new Date(travelPreferences.checkOut);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      duration = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    // Generate recommendations
    const needsChildFriendly = children > 0;
    const needsVegetarianOptions = culturalSettings.dietaryRestrictions.some(d => 
      ['vegetarian', 'vegan'].includes(d)
    );
    const needsAccessibility = mobilityNeeds.some(m => m.includes('low') || m.includes('medium'));
    
    const focusAreas: string[] = [];
    const avoidAreas: string[] = [];
    
    if (needsChildFriendly) {
      focusAreas.push('family-friendly activities', 'educational attractions');
      avoidAreas.push('late night entertainment', 'adults-only venues');
    }
    
    if (seniors > 0) {
      focusAreas.push('comfortable seating', 'accessible venues');
      avoidAreas.push('strenuous activities', 'crowded spaces');
    }
    
    if (needsAccessibility) {
      focusAreas.push('wheelchair accessible venues', 'short walking distances');
      avoidAreas.push('stairs-only access', 'long walking tours');
    }
    
    if (childrenInterests.includes('animals')) {
      focusAreas.push('zoos', 'aquariums', 'wildlife experiences');
    }
    
    if (adultInterests.includes('history') || childrenInterests.includes('history')) {
      focusAreas.push('museums', 'historical sites', 'cultural landmarks');
    }
    
    // Build context prompt
    const contextPrompt = buildContextPrompt({
      travelers: {
        adults,
        children,
        seniors,
        totalCount,
        ageRange,
        mobilityNeeds,
        childrenAges,
        adultInterests,
        childrenInterests,
        relationships
      },
      destination: travelPreferences.destination,
      dates: {
        checkin: travelPreferences.checkIn,
        checkout: travelPreferences.checkOut,
        duration
      },
      tripType: travelPreferences.tripType,
      budget: travelPreferences.budget,
      culturalBackground: culturalSettings.culturalBackground,
      dietaryRestrictions: culturalSettings.dietaryRestrictions,
      familyInterests: culturalSettings.familyInterests,
      recommendations: {
        needsChildFriendly,
        needsVegetarianOptions,
        needsAccessibility,
        focusAreas,
        avoidAreas
      }
    });
    
    return {
      travelers: {
        adults,
        children,
        seniors,
        totalCount,
        ageRange,
        mobilityNeeds,
        childrenAges,
        adultInterests,
        childrenInterests,
        relationships
      },
      destination: travelPreferences.destination,
      dates: {
        checkin: travelPreferences.checkIn,
        checkout: travelPreferences.checkOut,
        duration
      },
      tripType: travelPreferences.tripType,
      budget: travelPreferences.budget,
      culturalBackground: culturalSettings.culturalBackground,
      dietaryRestrictions: culturalSettings.dietaryRestrictions,
      familyInterests: culturalSettings.familyInterests,
      recommendations: {
        needsChildFriendly,
        needsVegetarianOptions,
        needsAccessibility,
        focusAreas,
        avoidAreas
      },
      contextPrompt
    };
  }, [travelers, travelPreferences, culturalSettings]);
  
  return travelContext;
};

const buildContextPrompt = (context: any): string => {
  const parts: string[] = [];
  
  // Family composition
  if (context.travelers.totalCount > 0) {
    parts.push(`FAMILY GROUP:`);
    parts.push(`- ${context.travelers.totalCount} travelers (${context.travelers.adults} adults, ${context.travelers.children} children${context.travelers.seniors > 0 ? `, ${context.travelers.seniors} seniors` : ''})`);
    
    if (context.travelers.ageRange) {
      parts.push(`- Age range: ${context.travelers.ageRange}`);
    }
    
    if (context.travelers.childrenInterests.length > 0) {
      parts.push(`- Children's interests: ${context.travelers.childrenInterests.join(', ')}`);
    }
    
    if (context.travelers.adultInterests.length > 0) {
      parts.push(`- Adult interests: ${context.travelers.adultInterests.join(', ')}`);
    }
    
    if (context.travelers.mobilityNeeds.length > 0) {
      parts.push(`- Mobility considerations: ${context.travelers.mobilityNeeds.join(', ')}`);
    }
    
    parts.push('');
  }
  
  // Trip details
  const tripDetails: string[] = [];
  if (context.destination) {
    tripDetails.push(`- Destination: ${context.destination}`);
  }
  if (context.dates.duration) {
    tripDetails.push(`- Duration: ${context.dates.duration}`);
  }
  if (context.dates.checkin) {
    tripDetails.push(`- Travel dates: ${context.dates.checkin}${context.dates.checkout ? ` to ${context.dates.checkout}` : ''}`);
  }
  if (context.budget) {
    tripDetails.push(`- Budget: ${context.budget}`);
  }
  if (context.tripType.length > 0) {
    tripDetails.push(`- Trip focus: ${context.tripType.join(', ')}`);
  }
  
  if (tripDetails.length > 0) {
    parts.push('TRIP DETAILS:');
    parts.push(...tripDetails);
    parts.push('');
  }
  
  // Special considerations
  const considerations: string[] = [];
  if (context.dietaryRestrictions.length > 0) {
    considerations.push(`- Dietary needs: ${context.dietaryRestrictions.join(', ')}`);
  }
  if (context.culturalBackground.length > 0) {
    considerations.push(`- Cultural preferences: ${context.culturalBackground.join(', ')}`);
  }
  if (context.familyInterests.length > 0) {
    considerations.push(`- Family interests: ${context.familyInterests.join(', ')}`);
  }
  
  if (considerations.length > 0) {
    parts.push('SPECIAL CONSIDERATIONS:');
    parts.push(...considerations);
    parts.push('');
  }
  
  // Recommendations guidance
  if (context.recommendations.focusAreas.length > 0 || context.recommendations.avoidAreas.length > 0) {
    parts.push('RECOMMENDATION GUIDANCE:');
    if (context.recommendations.focusAreas.length > 0) {
      parts.push(`- Focus on: ${context.recommendations.focusAreas.join(', ')}`);
    }
    if (context.recommendations.avoidAreas.length > 0) {
      parts.push(`- Avoid: ${context.recommendations.avoidAreas.join(', ')}`);
    }
    parts.push('');
  }
  
  // Final instruction
  parts.push('Please provide recommendations that work well for this multi-generational group with age-appropriate activities for everyone.');
  
  return parts.join('\n');
};

export default useTravelContext;