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

interface PromptGeneratorOptions {
  travelers: Traveler[];
  travelPreferences: TravelPreferences;
  culturalSettings: CulturalSettings;
  focusType?: 'general' | 'activities' | 'dining' | 'accommodation' | 'transportation';
}

export const generateBasePrompt = ({
  travelers,
  travelPreferences,
  culturalSettings,
  focusType = 'general'
}: PromptGeneratorOptions): string => {
  const parts: string[] = [];
  
  // Start with travel intent
  if (travelPreferences.destination) {
    parts.push(`I'm planning a trip to ${travelPreferences.destination}`);
  } else {
    parts.push(`I'm planning a family trip`);
  }
  
  // Add family composition
  if (travelers.length > 0) {
    const familyDesc = buildFamilyDescription(travelers);
    parts.push(`for ${familyDesc}`);
  }
  
  // Add dates if available
  if (travelPreferences.checkIn && travelPreferences.checkOut) {
    const checkin = new Date(travelPreferences.checkIn).toLocaleDateString();
    const checkout = new Date(travelPreferences.checkOut).toLocaleDateString();
    parts.push(`from ${checkin} to ${checkout}`);
  }
  
  // Add budget consideration
  if (travelPreferences.budget) {
    const budgetDesc = travelPreferences.budget.toLowerCase();
    parts.push(`with a ${budgetDesc} budget`);
  }
  
  // Add focus type specific request
  const focusRequest = getFocusRequest(focusType, culturalSettings);
  if (focusRequest) {
    parts.push(`. ${focusRequest}`);
  } else {
    parts.push('. What would you recommend?');
  }
  
  return parts.join(' ');
};

const buildFamilyDescription = (travelers: Traveler[]): string => {
  if (travelers.length === 0) return 'myself';
  if (travelers.length === 1) return `1 person`;
  
  const adults = travelers.filter(t => t.age >= 18 && t.age < 65).length;
  const children = travelers.filter(t => t.age < 18).length;
  const seniors = travelers.filter(t => t.age >= 65).length;
  const total = travelers.length;
  
  const parts: string[] = [];
  
  if (total === 1) {
    const traveler = travelers[0];
    if (traveler.age < 18) return 'a child';
    if (traveler.age >= 65) return 'a senior';
    return 'myself';
  }
  
  // Multi-person description
  const groupParts: string[] = [];
  if (adults > 0) groupParts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
  if (children > 0) groupParts.push(`${children} child${children > 1 ? 'ren' : ''}`);
  if (seniors > 0) groupParts.push(`${seniors} senior${seniors > 1 ? 's' : ''}`);
  
  if (groupParts.length === 1) {
    return groupParts[0];
  } else if (groupParts.length === 2) {
    return `${groupParts[0]} and ${groupParts[1]}`;
  } else {
    return `${groupParts.slice(0, -1).join(', ')}, and ${groupParts[groupParts.length - 1]}`;
  }
};

const getFocusRequest = (focusType: string, culturalSettings: CulturalSettings): string => {
  switch (focusType) {
    case 'activities':
      return 'What activities and attractions would you recommend for our group?';
    
    case 'dining':
      const dietaryNote = culturalSettings.dietaryRestrictions.length > 0 
        ? ` We have ${culturalSettings.dietaryRestrictions.join(' and ')} dietary requirements.`
        : '';
      return `What are the best restaurants and dining experiences for families?${dietaryNote}`;
    
    case 'accommodation':
      return 'What type of accommodation would work best for our group, and do you have specific recommendations?';
    
    case 'transportation':
      return 'What\'s the best way to get around and what transportation options would you recommend for our group?';
    
    case 'general':
    default:
      return 'What would you recommend for activities, dining, and places to stay?';
  }
};

export const generateQuickPrompts = (options: PromptGeneratorOptions): string[] => {
  const { travelers, travelPreferences, culturalSettings } = options;
  
  const quickPrompts: string[] = [];
  
  // General planning prompt
  quickPrompts.push(generateBasePrompt({ ...options, focusType: 'general' }));
  
  // Activity-focused prompt if we have children
  const hasChildren = travelers.some(t => t.age < 18);
  if (hasChildren) {
    quickPrompts.push(generateBasePrompt({ ...options, focusType: 'activities' }));
  }
  
  // Dining prompt if we have dietary restrictions or cultural preferences
  if (culturalSettings.dietaryRestrictions.length > 0 || culturalSettings.culturalBackground.length > 0) {
    quickPrompts.push(generateBasePrompt({ ...options, focusType: 'dining' }));
  }
  
  // Transportation prompt for groups with mobility considerations
  const hasMobilityNeeds = travelers.some(t => t.mobility !== 'high');
  if (hasMobilityNeeds) {
    quickPrompts.push(generateBasePrompt({ ...options, focusType: 'transportation' }));
  }
  
  return quickPrompts.slice(0, 3); // Return max 3 suggestions
};

export const hasValidSelections = (options: PromptGeneratorOptions): boolean => {
  const { travelers, travelPreferences } = options;
  
  // Need at least travelers or destination to generate meaningful prompts
  return travelers.length > 0 || travelPreferences.destination.trim().length > 0;
};