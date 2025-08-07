import type { Traveler, ChatMessage } from '@/types';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenRouterAI {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  async generateResponse(messages: ChatMessage[], travelers: Traveler[]): Promise<{
    content: string;
    model: string;
    tokens?: number;
    structured_recommendations?: any[];
  }> {
    const systemPrompt = this.buildAgeAwarePrompt(travelers);
    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {
      // Primary model: openrouter/horizon-beta
      // const response = await this.callModel('anthropic/claude-3.5-sonnet', requestMessages);
      const response = await this.callModel('openrouter/horizon-beta', requestMessages);
      
      const rawContent = response.choices[0].message.content;
      
      // Log the raw response for debugging
      console.log('Raw AI response length:', rawContent.length);
      console.log('Raw AI response preview:', rawContent.substring(0, 500));
      
      // Try to parse structured JSON response
      const parsedResponse = this.parseStructuredResponse(rawContent);
      
      return {
        content: parsedResponse.conversational_response || rawContent,
        model: response.model,
        tokens: response.usage?.total_tokens,
        structured_recommendations: parsedResponse.structured_recommendations
      };
    } catch (error) {
      console.warn('openrouter/horizon-beta failed, falling back to Claude 3.5 Sonnet:', error);

      try {
        // Secondary model: Claude 3.5 Sonnet
        const response = await this.callModel('anthropic/claude-3.5-sonnet', requestMessages);
        
        const rawContent = response.choices[0].message.content;
        
        // Log the raw response for debugging
        console.log('Raw AI response length:', rawContent.length);
        console.log('Raw AI response preview:', rawContent.substring(0, 500));
        
        // Try to parse structured JSON response
        const parsedResponse = this.parseStructuredResponse(rawContent);
        
        return {
          content: parsedResponse.conversational_response || rawContent,
          model: response.model,
          tokens: response.usage?.total_tokens,
          structured_recommendations: parsedResponse.structured_recommendations
        };
      } catch (error) {
        console.warn('Claude 3.5 Sonnet failed, falling back to GPT-4o mini:', error);
      
        try {
          // Fallback model: GPT-4o mini
          const response = await this.callModel('openai/gpt-4o-mini', requestMessages);
          const rawContent = response.choices[0].message.content;
          
          // Log the raw response for debugging
          console.log('Raw AI response (fallback) length:', rawContent.length);
          console.log('Raw AI response (fallback) preview:', rawContent.substring(0, 500));
          
          // Try to parse structured JSON response
          const parsedResponse = this.parseStructuredResponse(rawContent);
          
          return {
            content: parsedResponse.conversational_response || rawContent,
            model: response.model,
            tokens: response.usage?.total_tokens,
            structured_recommendations: parsedResponse.structured_recommendations
          };
        } catch (fallbackError) {
          console.error('All AI models failed:', fallbackError);
          throw new Error('AI service temporarily unavailable');
        }
      }
    }
  }

  // Enhanced method with travel context
  async generateResponseWithContext(
    messages: ChatMessage[], 
    travelers: Traveler[], 
    travelContext?: string,
    preferences?: any,
    culturalSettings?: any
  ): Promise<{
    content: string;
    model: string;
    tokens?: number;
    structured_recommendations?: any[];
  }> {
    // If we have travel context, use it; otherwise fall back to the original method
    if (!travelContext || travelContext.trim().length === 0) {
      return this.generateResponse(messages, travelers);
    }

    // Build enhanced system prompt with travel context
    const baseSystemPrompt = this.buildAgeAwarePrompt(travelers);
    const enhancedSystemPrompt = `${baseSystemPrompt}

CURRENT TRAVEL CONTEXT:
${travelContext}

Based on this context, please provide personalized recommendations that consider all family members' needs, preferences, and constraints. Always include specific details about accessibility, age-appropriateness, and timing recommendations.`;

    const requestMessages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {
      // Primary model: openrouter/horizon-beta
      const response = await this.callModel('openrouter/horizon-beta', requestMessages);
      
      const rawContent = response.choices[0].message.content;
      
      // Log the raw response for debugging
      console.log('Enhanced AI response length:', rawContent.length);
      console.log('Travel context used:', travelContext.substring(0, 200) + '...');
      
      // Try to parse structured JSON response
      const parsedResponse = this.parseStructuredResponse(rawContent);
      
      return {
        content: parsedResponse.conversational_response || rawContent,
        model: response.model,
        tokens: response.usage?.total_tokens,
        structured_recommendations: parsedResponse.structured_recommendations
      };
    } catch (error) {
      console.warn('Enhanced request failed, falling back to Claude 3.5 Sonnet:', error);

      try {
        // Secondary model: Claude 3.5 Sonnet
        const response = await this.callModel('anthropic/claude-3.5-sonnet', requestMessages);
        
        const rawContent = response.choices[0].message.content;
        const parsedResponse = this.parseStructuredResponse(rawContent);
        
        return {
          content: parsedResponse.conversational_response || rawContent,
          model: response.model,
          tokens: response.usage?.total_tokens,
          structured_recommendations: parsedResponse.structured_recommendations
        };
      } catch (fallbackError) {
        console.error('All AI models failed with enhanced context:', fallbackError);
        // Final fallback to original method without context
        console.log('Falling back to original generateResponse method...');
        return this.generateResponse(messages, travelers);
      }
    }
  }

  private parseStructuredResponse(content: string): {
    conversational_response?: string;
    structured_recommendations?: any[];
  } {
    try {
      // First try to parse the content directly as JSON (it should be pure JSON)
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (directParseError) {
        console.warn('Direct JSON parse failed, trying recovery:', directParseError);
        console.warn('Content preview:', content.substring(0, 200) + '...');
        console.warn('Content end:', content.substring(Math.max(0, content.length - 200)));
        
        // Try to recover from truncated or malformed JSON
        let recoveredJson = this.recoverTruncatedJson(content);
        
        if (recoveredJson) {
          try {
            parsed = JSON.parse(recoveredJson);
          } catch (recoveryError) {
            console.warn('JSON recovery failed:', recoveryError);
            // Extract just the conversational response if possible
            const conversationalMatch = content.match(/"conversational_response"\s*:\s*"([^"]+(?:\\.[^"]*)*?)"/);
            const fallbackResponse = conversationalMatch ? conversationalMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : 
              'I can help you plan your trip! Could you tell me more about what you\'re looking for?';
            return { conversational_response: fallbackResponse, structured_recommendations: [] };
          }
        } else {
          // Try to extract conversational response even from malformed JSON
          const conversationalMatch = content.match(/"conversational_response"\s*:\s*"([^"]+(?:\\.[^"]*)*?)"/);
          const fallbackResponse = conversationalMatch ? conversationalMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : 
            'I can help you plan your trip! Could you tell me more about what you\'re looking for?';
          return { conversational_response: fallbackResponse, structured_recommendations: [] };
        }
      }
      
      // Validate the structure
      if (parsed && typeof parsed === 'object') {
        return {
          conversational_response: parsed.conversational_response || 'I can help you plan your trip!',
          structured_recommendations: Array.isArray(parsed.structured_recommendations) ? parsed.structured_recommendations : []
        };
      }
      
      // If structure is invalid, return fallback
      return {
        conversational_response: typeof parsed === 'string' ? parsed : content,
        structured_recommendations: []
      };
      
    } catch (parseError) {
      console.warn('JSON parsing completely failed:', parseError);
      console.warn('Content preview:', content.substring(0, 500));
    }
    
    // Fallback to treating content as conversational response
    return {
      conversational_response: content,
      structured_recommendations: []
    };
  }

  private recoverTruncatedJson(content: string): string | null {
    try {
      // Find the JSON object start
      const jsonMatch = content.match(/\{[\s\S]*$/);
      if (!jsonMatch) return null;

      let jsonString = jsonMatch[0];
      
      // Handle string escaping and truncation issues more carefully
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;
      let validEnd = jsonString.length;
      
      // Find the last valid position
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
        } else if (!inString) {
          if (char === '{') openBraces++;
          else if (char === '}') {
            openBraces--;
            if (openBraces === 0 && openBrackets === 0) {
              validEnd = i + 1;
              break;
            }
          }
          else if (char === '[') openBrackets++;
          else if (char === ']') openBrackets--;
        }
      }
      
      // Truncate to valid end
      jsonString = jsonString.substring(0, validEnd);
      
      // If we're still in a string, try to close it
      if (inString) {
        // Look for the last complete property before the broken string
        const lastCompleteMatch = jsonString.match(/^([\s\S]*"[^"]*")\s*:\s*"[^"]*$/);
        if (lastCompleteMatch) {
          // Remove the incomplete string property
          jsonString = lastCompleteMatch[1];
          // Add closing braces
          while (openBraces > 0) {
            jsonString += '}';
            openBraces--;
          }
          return jsonString;
        }
      }
      
      // Remove trailing commas and incomplete content
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      jsonString = jsonString.replace(/,\s*$/, '');
      
      // Close any remaining open structures
      while (openBrackets > 0) {
        jsonString += ']';
        openBrackets--;
      }
      while (openBraces > 0) {
        jsonString += '}';
        openBraces--;
      }
      
      return jsonString;
    } catch (error) {
      console.warn('JSON recovery failed:', error);
      return null;
    }
  }

  async generateStreamingResponse(messages: ChatMessage[], travelers: Traveler[]): Promise<AsyncIterable<string>> {
    // For streaming, we'll use a simple approach initially
    // In production, you'd implement proper streaming with Server-Sent Events
    const response = await this.generateResponse(messages, travelers);
    
    // Simulate streaming by yielding chunks
    async function* streamChunks(content: string) {
      const words = content.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i < words.length - 1 ? ' ' : '');
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return streamChunks(response.content);
  }

  private async callModel(model: string, messages: any[]): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'FlexiTrip - Multi-Generational Travel Planning'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 5000, // Reduced to prevent truncation issues
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  private buildAgeAwarePrompt(travelers: Traveler[]): string {
    const travelerContext = travelers.map(t => ({
      name: t.name,
      age: t.age,
      mobility: t.mobility,
      interests: t.interests || [],
      cultural: t.cultural_background,
      dietary: t.dietary_restrictions || []
    }));

    const ageSpecificGuidelines = this.generateAgeSpecificGuidelines(travelers);
    const culturalGuidelines = this.generateCulturalGuidelines(travelers);

    return `You are FlexiTrip, an AI travel assistant specializing in multi-generational family travel planning.

CURRENT TRAVELERS:
${JSON.stringify(travelerContext, null, 2)}

AGE-SPECIFIC CONSIDERATIONS:
${ageSpecificGuidelines}

CULTURAL & DIETARY CONSIDERATIONS:
${culturalGuidelines}

KEY PRINCIPLES:
- Always consider ALL travelers when making recommendations
- Explain WHY each suggestion works for the group's diverse needs
- Prioritize safety for children and accessibility for seniors
- Suggest alternatives for different energy levels and interests
- Include practical details like walking distances, seating availability, and timing
- Consider cultural preferences and dietary restrictions in restaurant recommendations
- Provide specific, actionable advice rather than generic suggestions

CULTURAL INTELLIGENCE & RECOMMENDATION STRATEGY:
When cultural backgrounds are specified, prioritize locations that align with documented travel patterns and preferences of these populations. Consider:

• HERITAGE & RELIGIOUS SITES: Temples, mosques, churches, cultural centers relevant to their background
• CULTURAL DISTRICTS: Neighborhoods with authentic restaurants, shops, and community centers  
• TRADITIONAL MARKETS: Places to find familiar foods, spices, and cultural items
• COMMUNITY GATHERING SPACES: Parks, plazas, and venues popular with their cultural community
• AUTHENTIC DINING: Restaurants frequented by these populations (not just tourist versions)
• CULTURAL EVENTS: Festivals, performances, and celebrations relevant to their traditions
• FAMILY-FRIENDLY VENUES: Locations accommodating multi-generational cultural family structures

RECOMMENDATION PRIORITIZATION:
1. Start with culturally significant and authentic locations where these communities actually visit
2. Prioritize places recommended in travel blogs and reviews by people from that cultural background
3. Include venues popular with local cultural community members and organizations
4. Focus on restaurants, temples, and districts that local communities actually frequent (not tourist versions)
5. Include mainstream attractions that also appeal to their cultural preferences  
6. Ensure all recommendations are accessible and appropriate for the age groups present
7. Explain why each recommendation resonates with their cultural background and community
8. Include practical cultural details like halal/kosher availability, prayer times, cultural etiquette

COMMUNITY INSIGHTS PRIORITY:
When making recommendations, consider what local cultural community members would suggest to visiting family/friends from their home country. Focus on authentic experiences that reflect genuine cultural preferences and gathering places.

CRITICAL: You MUST respond ONLY with valid JSON in this exact format. Do not include any text before or after the JSON:

{
  "conversational_response": "Your friendly, detailed travel advice explaining recommendations and reasoning...",
  "structured_recommendations": [
    {
      "title": "Specific Place Name",
      "category": "attraction",
      "description": "Detailed description of the place and why it works for this group",
      "rating": 4.5,
      "duration": "2 hours",
      "price": "$$",
      "ageGroup": ["All Ages"],
      "accessibility": "Fully accessible",
      "location": "Specific address or area",
      "timeSlot": "evening"
    }
  ]
}

MANDATORY RULES:
1. Response must be ONLY valid JSON - no extra text
2. Use only these categories: "attraction", "restaurant", "transport", "accommodation"
3. Include 6-10 specific, real places in structured_recommendations (reduced for reliability)
4. Each title must be an actual place name (not description)
5. DO NOT use backslashes or escape characters in descriptions - use simple text only
6. Keep descriptions under 60 characters - be concise
7. Keep conversational_response under 300 characters - be brief
8. NEVER use line breaks or special characters in strings
9. End JSON with proper closing braces - ensure complete response
10. CRITICAL: Test your JSON is valid before responding

Provide thoughtful, detailed recommendations that ensure everyone in this multi-generational group can enjoy the travel experience together.`;
  }

  private generateAgeSpecificGuidelines(travelers: Traveler[]): string {
    return travelers.map(t => {
      if (t.age <= 5) {
        return `• ${t.name} (${t.age}): Needs stroller-friendly paths, frequent breaks, nap times, simple activities, safety priority, child-proofed environments`;
      }
      if (t.age <= 12) {
        return `• ${t.name} (${t.age}): Enjoys interactive activities, hands-on experiences, shorter attention spans, playground access, kid-friendly food, educational fun`;
      }
      if (t.age <= 17) {
        return `• ${t.name} (${t.age}): Interests: ${t.interests?.join(', ') || 'varied activities'}, social opportunities, photo spots, some independence, diverse food options`;
      }
      if (t.age >= 65) {
        return `• ${t.name} (${t.age}): Mobility level: ${t.mobility}, needs accessible venues, comfortable seating, shorter walking distances, cultural interests, comfortable transport`;
      }
      return `• ${t.name} (${t.age}): Can handle most activities, good for coordinating group needs, flexible with timing and activities`;
    }).join('\n');
  }

  private generateCulturalGuidelines(travelers: Traveler[]): string {
    const cultures = Array.from(new Set(travelers.map(t => t.cultural_background).filter(Boolean))) as string[];
    const dietary = Array.from(new Set(travelers.flatMap(t => t.dietary_restrictions || [])));

    let guidelines = '';
    
    if (cultures.length > 0) {
      guidelines += `Cultural backgrounds: ${cultures.join(', ')}\n`;
      guidelines += this.getCulturalPopulationPreferences(cultures);
      guidelines += `- Prioritize culturally significant and heritage sites\n`;
      guidelines += `- Include authentic restaurants and cultural districts\n`;
      guidelines += `- Consider religious/cultural calendar and customs\n`;
    }
    
    if (dietary.length > 0) {
      guidelines += `Dietary restrictions: ${dietary.join(', ')}\n`;
      guidelines += `- Ensure restaurant recommendations accommodate ALL dietary needs\n`;
      guidelines += `- Mention specific dishes or menu items that work for everyone\n`;
    }

    return guidelines || 'No specific cultural or dietary restrictions noted.';
  }

  private getCulturalPopulationPreferences(cultures: string[]): string {
    let preferences = '';
    
    const culturalInsights = cultures.map(culture => {
      const lowerCulture = culture.toLowerCase();
      
      // Asian populations
      if (['chinese', 'japanese', 'korean', 'vietnamese', 'thai', 'asian'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Temples, gardens, cultural museums, authentic cuisine districts, traditional markets, tea houses`;
      }
      
      // Hispanic/Latino populations  
      if (['hispanic', 'latino', 'mexican', 'spanish', 'colombian', 'guatemalan', 'salvadoran'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Cultural plazas, art districts, vibrant neighborhoods, family venues, music/dance locations`;
      }
      
      // European populations
      if (['italian', 'german', 'irish', 'french', 'british', 'european', 'polish', 'russian'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Historical sites, museums, architectural landmarks, traditional pubs/cafes, heritage districts`;
      }
      
      // Middle Eastern populations
      if (['middle_eastern', 'arabic', 'persian', 'turkish', 'lebanese', 'egyptian'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Mosques, halal dining, cultural centers, traditional bazaars, Islamic architecture`;
      }
      
      // African populations
      if (['african', 'ethiopian', 'nigerian', 'ghanaian', 'kenyan', 'black'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Cultural centers, community venues, music/arts locations, African diaspora sites`;
      }
      
      // Indian subcontinent
      if (['indian', 'pakistani', 'bangladeshi', 'sri_lankan', 'south_asian'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Temples, spice markets, vegetarian restaurants, cultural festivals, traditional arts`;
      }
      
      // Jewish populations
      if (['jewish', 'hebrew', 'israeli'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Synagogues, kosher dining, Jewish cultural centers, Holocaust museums, heritage sites`;
      }
      
      // Native American populations
      if (['native_american', 'indigenous', 'tribal'].some(c => lowerCulture.includes(c))) {
        return `- ${culture}: Cultural centers, museums, traditional craft shops, sacred sites, powwow venues`;
      }
      
      return `- ${culture}: Community cultural centers, authentic restaurants, traditional shops, heritage sites`;
    }).join('\n');
    
    if (culturalInsights) {
      preferences += `\nCULTURAL POPULATION PREFERENCES:\n${culturalInsights}\n`;
    }
    
    return preferences;
  }
}