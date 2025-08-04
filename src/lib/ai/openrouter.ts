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
        console.warn('Direct JSON parse failed, trying extraction:', directParseError);
        
        // If direct parsing fails, try to find a complete JSON object
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return { conversational_response: content, structured_recommendations: [] };
        }

        let jsonString = jsonMatch[0];
        
        // Try to fix common JSON issues
        // Remove trailing commas before closing brackets/braces
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

        parsed = JSON.parse(jsonString);
      }
      
      // Validate the structure
      if (parsed.conversational_response && Array.isArray(parsed.structured_recommendations)) {
        return parsed;
      }
      
      // If structure is invalid but we have some data, try to salvage it
      return {
        conversational_response: parsed.conversational_response || content,
        structured_recommendations: Array.isArray(parsed.structured_recommendations) ? parsed.structured_recommendations : []
      };
      
    } catch (parseError) {
      console.warn('JSON parsing completely failed:', parseError);
      console.warn('Content preview:', content.substring(0, 500));
    }
    
    // Fallback to original parsing method if structured parsing fails
    return {
      conversational_response: content,
      structured_recommendations: []
    };
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
        max_tokens: 2000, // Increased for structured responses
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
3. Include 4-8 specific, real places in structured_recommendations
4. Each title must be an actual place name (not description)
5. Escape quotes in descriptions using backslash
6. Keep descriptions under 100 characters to avoid JSON issues
7. End JSON with proper closing braces - ensure complete response

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
    const cultures = Array.from(new Set(travelers.map(t => t.cultural_background).filter(Boolean)));
    const dietary = Array.from(new Set(travelers.flatMap(t => t.dietary_restrictions || [])));

    let guidelines = '';
    
    if (cultures.length > 0) {
      guidelines += `Cultural backgrounds: ${cultures.join(', ')}\n`;
      guidelines += `- Recommend culturally relevant sites, festivals, and experiences\n`;
      guidelines += `- Suggest authentic restaurants representing these cultures\n`;
    }
    
    if (dietary.length > 0) {
      guidelines += `Dietary restrictions: ${dietary.join(', ')}\n`;
      guidelines += `- Ensure restaurant recommendations accommodate ALL dietary needs\n`;
      guidelines += `- Mention specific dishes or menu items that work for everyone\n`;
    }

    return guidelines || 'No specific cultural or dietary restrictions noted.';
  }
}