import { RecommendationData } from '@/components/chat/RecommendationCard';

export interface ParsedResponse {
  hasRecommendations: boolean;
  recommendations: RecommendationData[];
  originalText: string;
}

// Keywords to identify categories
const categoryKeywords = {
  attraction: [
    'museum', 'park', 'monument', 'landmark', 'attraction', 'site', 'tower', 'bridge',
    'temple', 'church', 'cathedral', 'palace', 'castle', 'fort', 'zoo', 'aquarium',
    'garden', 'beach', 'mountain', 'lake', 'river', 'viewpoint', 'observatory',
    'gallery', 'exhibition', 'memorial', 'statue', 'plaza', 'square'
  ],
  restaurant: [
    'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'food', 'cuisine', 'meal',
    'dining', 'bar', 'pub', 'tavern', 'grill', 'bakery', 'market', 'street food',
    'lunch', 'dinner', 'breakfast', 'brunch', 'snack', 'dessert', 'coffee'
  ],
  transport: [
    'transport', 'taxi', 'uber', 'bus', 'train', 'metro', 'subway', 'tram',
    'ferry', 'boat', 'car', 'rental', 'walk', 'bike', 'scooter', 'ride',
    'shuttle', 'airport', 'station', 'getting around', 'travel'
  ],
  accommodation: [
    'hotel', 'hostel', 'resort', 'inn', 'lodge', 'motel', 'bnb', 'airbnb',
    'accommodation', 'stay', 'room', 'suite', 'apartment', 'villa'
  ]
};

// Age group keywords
const ageGroupKeywords = {
  'All Ages': ['all ages', 'family-friendly', 'everyone', 'suitable for all'],
  'Kids Love': ['kids', 'children', 'toddler', 'interactive', 'playground', 'fun for kids'],
  'Adults': ['adults', 'mature', 'sophisticated', 'adult-oriented'],
  'Seniors': ['seniors', 'elderly', 'accessible', 'easy walk', 'wheelchair'],
  'Teens': ['teens', 'teenagers', 'youth', 'adventure', 'exciting']
};

// Dietary keywords
const dietaryKeywords = {
  'Vegetarian': ['vegetarian', 'veggie', 'plant-based'],
  'Vegan': ['vegan', 'plant-only'],
  'Gluten-Free': ['gluten-free', 'celiac', 'gluten free'],
  'Halal': ['halal', 'muslim-friendly'],
  'Kosher': ['kosher', 'jewish'],
  'Dairy-Free': ['dairy-free', 'lactose-free', 'no dairy']
};

function detectCategory(text: string): RecommendationData['category'] {
  const lowerText = text.toLowerCase();
  
  // Count matches for each category
  const scores = {
    attraction: 0,
    restaurant: 0,
    transport: 0,
    accommodation: 0
  };

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        scores[category as keyof typeof scores]++;
      }
    });
  });

  // Return category with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'attraction'; // default
  
  return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as RecommendationData['category'] || 'attraction';
}

function extractAgeGroups(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  Object.entries(ageGroupKeywords).forEach(([ageGroup, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detected.push(ageGroup);
    }
  });

  return detected.length > 0 ? detected : ['All Ages'];
}

function extractDietaryOptions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  Object.entries(dietaryKeywords).forEach(([option, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detected.push(option);
    }
  });

  return detected;
}

function extractRating(text: string): number | undefined {
  // Look for ratings like "4.5 stars", "rated 4.2", "4/5"
  const ratingPatterns = [
    /(\d+\.?\d*)\s*(?:stars?|\/5|rating)/i,
    /rated?\s*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*out of 5/i
  ];

  for (const pattern of ratingPatterns) {
    const match = text.match(pattern);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating >= 0 && rating <= 5) {
        return rating;
      }
    }
  }
  return undefined;
}

function extractDuration(text: string): string | undefined {
  // Look for time durations
  const durationPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i,
    /(\d+)\s*(?:minutes?|mins?|m)\b/i,
    /(\d+)\s*(?:days?|d)\b/i,
    /(?:takes?|lasts?|duration)\s*(?:about|around)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|minutes?|mins?)/i
  ];

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (pattern.source.includes('hours?|hrs?|h')) {
        return value === 1 ? '1 hour' : `${value} hours`;
      } else if (pattern.source.includes('minutes?|mins?|m')) {
        return value === 1 ? '1 minute' : `${value} minutes`;
      } else if (pattern.source.includes('days?|d')) {
        return value === 1 ? '1 day' : `${value} days`;
      }
    }
  }
  return undefined;
}

function extractPrice(text: string): string | undefined {
  // Look for price indicators
  const pricePatterns = [
    /\$+/g, // $ symbols
    /(?:free|no cost|complimentary)/i,
    /(?:expensive|pricey|costly)/i,
    /(?:cheap|affordable|budget)/i,
    /(?:moderate|reasonable)/i
  ];

  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('free') || lowerText.includes('no cost') || lowerText.includes('complimentary')) {
    return 'Free';
  } else if (lowerText.includes('expensive') || lowerText.includes('pricey') || lowerText.includes('costly')) {
    return '$$$';
  } else if (lowerText.includes('cheap') || lowerText.includes('affordable') || lowerText.includes('budget')) {
    return '$';
  } else if (lowerText.includes('moderate') || lowerText.includes('reasonable')) {
    return '$$';
  }

  // Count $ symbols
  const dollarMatches = text.match(/\$/g);
  if (dollarMatches) {
    return '$'.repeat(Math.min(dollarMatches.length, 4));
  }

  return undefined;
}

function extractAccessibility(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('wheelchair accessible') || lowerText.includes('fully accessible')) {
    return 'Fully accessible';
  } else if (lowerText.includes('limited access') || lowerText.includes('partially accessible')) {
    return 'Limited accessibility';
  } else if (lowerText.includes('not accessible') || lowerText.includes('stairs only')) {
    return 'Not accessible';
  }
  
  return undefined;
}

export function parseAIResponse(text: string): ParsedResponse {
  const originalText = text;
  
  // Check if the text contains recommendations
  const hasRecommendationIndicators = [
    'recommend', 'suggest', 'try', 'visit', 'check out', 'consider',
    'great place', 'perfect for', 'ideal for', 'must-see', 'don\'t miss'
  ].some(indicator => text.toLowerCase().includes(indicator));

  if (!hasRecommendationIndicators) {
    return {
      hasRecommendations: false,
      recommendations: [],
      originalText
    };
  }

  // Split text into potential recommendations
  const lines = text.split(/\n|•|\*|\d+\./g)
    .map(line => line.trim())
    .filter(line => line.length > 10); // Filter out very short lines

  const recommendations: RecommendationData[] = [];

  lines.forEach((line, index) => {
    // Skip lines that are just descriptions or don't seem like recommendations
    if (!line || line.length < 20) return;
    
    // Extract title (usually the first part before a colon, dash, or description)
    const titleMatch = line.match(/^([^:\-\.]+)(?:[:.\-]|$)/);
    const title = titleMatch ? titleMatch[1].trim() : line.substring(0, 50).trim();
    
    if (!title || title.length < 3) return;

    const category = detectCategory(line);
    const ageGroup = extractAgeGroups(line);
    const rating = extractRating(line);
    const duration = extractDuration(line);
    const price = extractPrice(line);
    const accessibility = extractAccessibility(line);
    const dietaryOptions = category === 'restaurant' ? extractDietaryOptions(line) : undefined;

    // Create description (remove the title part)
    let description = line;
    if (titleMatch && titleMatch[0].length < line.length) {
      description = line.substring(titleMatch[0].length).trim();
      // Remove leading punctuation
      description = description.replace(/^[:.\-\s]+/, '');
    }

    // Limit description length
    if (description.length > 150) {
      description = description.substring(0, 147) + '...';
    }

    recommendations.push({
      id: `rec_${Date.now()}_${index}`,
      title,
      category,
      rating,
      duration,
      ageGroup,
      accessibility,
      price,
      description: description || title,
      dietaryOptions
    });
  });

  return {
    hasRecommendations: recommendations.length > 0,
    recommendations,
    originalText
  };
}