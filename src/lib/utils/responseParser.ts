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
    'hotel', 'hostel', 'resort', 'inn', 'lodge', 'motel', 'bnb', 'vacation rental',
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

export function parseAIResponse(text: string, structuredRecommendations?: any[]): ParsedResponse {
  const originalText = text;
  
  // If we have structured recommendations from the AI, use those directly
  if (structuredRecommendations && structuredRecommendations.length > 0) {
    const recommendations: RecommendationData[] = structuredRecommendations.map((rec, index) => ({
      id: `rec_${Date.now()}_${index}`,
      title: rec.title || 'Unknown',
      category: rec.category || 'attraction',
      rating: rec.rating,
      duration: rec.duration,
      ageGroup: rec.ageGroup || ['All Ages'],
      accessibility: rec.accessibility,
      price: rec.price,
      description: rec.description || rec.title || 'No description available',
      location: rec.location,
      dietaryOptions: rec.dietaryOptions,
      timeSlot: rec.timeSlot
    }));

    return {
      hasRecommendations: true,
      recommendations,
      originalText
    };
  }
  
  // Fallback to old parsing method if no structured recommendations
  // Check if the text contains recommendations
  const hasRecommendationIndicators = [
    'recommend', 'suggest', 'try', 'visit', 'check out', 'consider',
    'great place', 'perfect for', 'ideal for', 'must-see', 'don\'t miss',
    'attraction', 'restaurant', 'hotel', 'activity'
  ].some(indicator => text.toLowerCase().includes(indicator));

  if (!hasRecommendationIndicators) {
    return {
      hasRecommendations: false,
      recommendations: [],
      originalText
    };
  }

  // Split text into potential recommendations using more specific patterns
  // Look for numbered lists, bullet points, or clear line breaks
  const lines = text.split(/\n\s*(?:\d+\.|•|\*|-)\s*|\n\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 20); // Filter out short fragments

  const recommendations: RecommendationData[] = [];

  lines.forEach((line, index) => {
    // Skip lines that are just descriptions or don't seem like recommendations
    if (!line) return;
    
    // Clean up the line - remove leading bullets/numbers
    const cleanLine = line.replace(/^(?:\d+\.|•|\*|-)\s*/, '').trim();
    if (cleanLine.length < 20) return;
    
    // Extract title (look for patterns that indicate a recommendation title)
    // Try to find title before colon, dash, or "is/are" constructions
    const titlePatterns = [
      /^([^:\-–]+)(?:\s*[:–-]\s*)/,  // Title: Description or Title - Description
      /^([^\.!?]+?)(?:\s+(?:is|are|offers?|provides?|features?)\s+)/i, // Title is/are/offers description
      /^([A-Z][^\.!?]{5,40})(?:\.|$)/, // Capitalized title ending with period
      /^([^\.!?]{10,60})(?=\s*[A-Z])/  // Title followed by another capitalized sentence
    ];
    
    let title = '';
    let description = cleanLine;
    
    for (const pattern of titlePatterns) {
      const match = cleanLine.match(pattern);
      if (match && match[1].trim().length >= 5 && match[1].trim().length <= 80) {
        title = match[1].trim();
        description = cleanLine.substring(match[0].length).trim();
        break;
      }
    }
    
    // If no clear title pattern found, use first meaningful words as title
    if (!title) {
      const words = cleanLine.split(' ');
      if (words.length >= 3) {
        title = words.slice(0, Math.min(8, Math.ceil(words.length / 3))).join(' ').trim();
        // Remove trailing punctuation from title
        title = title.replace(/[:\-–.,!?]+$/, '');
        description = cleanLine;
      } else {
        return; // Skip if we can't extract a meaningful title
      }
    }
    
    // Validate title quality
    if (!title || title.length < 5 || title.length > 100) return;
    
    // Skip if title looks like a sentence fragment or description
    const invalidTitlePatterns = [
      /^(with|and|or|but|the|a|an|in|on|at|by|for|to|of|from)\s/i,
      /\s(is|are|was|were|will|would|could|should|might|may)(\s|$)/i,
      /^(upscale|relaxed|excellent|great|perfect|ideal|wonderful|amazing|beautiful)\s+but\s/i,
      /^(atmosphere|views?|options?|experience|selection)\s/i,
      /^(browse|enjoy|explore|discover|sample)\s/i,
      /\s+(options?|recommendations?|organized by)\s/i
    ];
    
    if (invalidTitlePatterns.some(pattern => pattern.test(title))) return;
    
    // Additional validation: ensure title seems like an actual place/attraction name
    const titleWords = title.toLowerCase().split(/\s+/);
    const hasLocationIndicators = titleWords.some(word => 
      ['museum', 'park', 'center', 'gallery', 'restaurant', 'cafe', 'hotel', 'tower', 'bridge', 
       'cathedral', 'church', 'temple', 'palace', 'castle', 'market', 'plaza', 'square',
       'bar', 'pub', 'grill', 'bistro', 'diner', 'resort', 'inn'].includes(word)
    );
    
    // If title doesn't have location indicators and is very generic, skip it
    const genericPhrases = [
      'strip views', 'atmosphere with', 'excellent', 'organized by type',
      'make reservations', 'evening stroll', 'transport options'
    ];
    
    if (!hasLocationIndicators && genericPhrases.some(phrase => title.toLowerCase().includes(phrase))) {
      return;
    }

    const category = detectCategory(cleanLine);
    const ageGroup = extractAgeGroups(cleanLine);
    const rating = extractRating(cleanLine);
    const duration = extractDuration(cleanLine);
    const price = extractPrice(cleanLine);
    const accessibility = extractAccessibility(cleanLine);
    const dietaryOptions = category === 'restaurant' ? extractDietaryOptions(cleanLine) : undefined;

    // Clean up description
    if (!description || description === title) {
      description = cleanLine;
    }
    
    // Remove leading punctuation from description
    description = description.replace(/^[:.\-–\s]+/, '');
    
    // Limit description length
    if (description.length > 150) {
      description = description.substring(0, 147) + '...';
    }
    
    // Ensure we have a meaningful description
    if (!description || description.trim().length < 10) {
      description = title; // Fall back to title if description is too short
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