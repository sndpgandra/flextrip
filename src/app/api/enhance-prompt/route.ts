import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PromptEnhancementSchema = z.object({
  basePrompt: z.string().min(1).max(2000),
  travelContext: z.string().optional(),
  sessionId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 requests per minute for prompt enhancement
    const clientIP = request.ip || 'unknown';
    const rateLimitResult = rateLimit(`enhance_${clientIP}`, 3, 60000);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before enhancing another prompt.',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const validation = PromptEnhancementSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid prompt enhancement request', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { basePrompt, travelContext } = validation.data;
    
    // Create enhancement prompt for the AI
    const enhancementSystemPrompt = `You are a travel planning assistant that helps enhance user queries with cultural population insights and authentic travel experiences.

Your task is to take a basic travel query and enhance it with specific details that will lead to more personalized and culturally authentic recommendations.

Guidelines:
1. Keep the user's original intent and tone
2. Add specific context about family group, cultural preferences, and accessibility needs
3. Include insights about where cultural populations actually visit and gather (not just stereotypes)
4. Add requests for authentic restaurants, cultural districts, and community-frequented venues  
5. Incorporate accessibility requirements, dietary preferences, and age-appropriate considerations
6. Mention specific types of venues (temples, cultural centers, traditional markets) when relevant to their background
7. Add practical details like reserve-ahead tips, accessibility features, and discount mentions
8. Request recommendations based on travel blogs, reviews, and community insights from that cultural population
9. Ask for places recommended by cultural community members and local cultural organizations
10. Make the query more actionable and specific for better LLM responses
11. Ensure it flows naturally and doesn't feel robotic
12. Keep it comprehensive but concise (under 400 words)

When enhancing queries with cultural backgrounds, focus on authentic community experiences:
- For Indian/South Asian: Traditional spice markets, temples, vegetarian options, Jain/egg-free preferences
- For Chinese: Cultural districts, traditional tea houses, temples, authentic community restaurants
- For Hispanic/Latino: Cultural plazas, authentic local restaurants, art districts, family venues
- For Middle Eastern: Halal dining, Islamic centers, traditional bazaars, community-frequented spots
- For Jewish: Kosher options, synagogues, heritage sites, community-popular restaurants
- For African: Authentic restaurants, cultural centers, music venues, community spaces

Always prioritize places where these communities actually gather and dine, not just tourist-oriented cultural sites.

IMPORTANT: In your enhanced query, specifically request:
- Recommendations based on travel blogs and reviews written by people from that cultural background
- Places recommended by local cultural community members and organizations  
- Venues that are popular with the local cultural population (not just tourists)
- Authentic experiences that cultural community members would suggest to visiting family/friends
- Cultural districts, temples, and restaurants that local communities actually frequent

This will help the LLM provide recommendations based on authentic community insights rather than generic tourist attractions.

Context Information:
${travelContext || 'No specific travel context provided'}

Return only the enhanced query, no explanations or additional text.`;

    const enhancementMessages = [
      {
        role: 'system',
        content: enhancementSystemPrompt
      },
      {
        role: 'user',
        content: `Please enhance this travel query: "${basePrompt}"`
      }
    ];
    
    // Try primary model first: openrouter/horizon-beta
    let enhancedPrompt = basePrompt;
    let modelUsed = 'fallback';
    let tokensUsed = 0;
    
    try {
      const primaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'FlexiTrip - Prompt Enhancement'
        },
        body: JSON.stringify({
          model: 'openrouter/horizon-beta', // Primary model
          messages: enhancementMessages,
          max_tokens: 500, // Increased for complete prompts
          temperature: 0.7
        })
      });

      if (primaryResponse.ok) {
        const primaryData = await primaryResponse.json();
        enhancedPrompt = primaryData.choices[0]?.message?.content || basePrompt;
        modelUsed = 'openrouter/horizon-beta';
        tokensUsed = primaryData.usage?.total_tokens || 0;
      } else {
        throw new Error('Primary model failed');
      }
    } catch (primaryError) {
      console.warn('openrouter/horizon-beta failed for prompt enhancement, falling back to GPT-4o mini:', primaryError);
      
      try {
        // Fallback to GPT-4o mini
        const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'FlexiTrip - Prompt Enhancement Fallback'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini', // Fallback model
            messages: enhancementMessages,
            max_tokens: 500, // Increased for complete prompts
            temperature: 0.7
          })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          enhancedPrompt = fallbackData.choices[0]?.message?.content || basePrompt;
          modelUsed = 'openai/gpt-4o-mini';
          tokensUsed = fallbackData.usage?.total_tokens || 0;
        } else {
          throw new Error('Fallback model also failed');
        }
      } catch (fallbackError) {
        console.error('Both primary and fallback models failed for prompt enhancement:', fallbackError);
        // Return original prompt if both models fail
        enhancedPrompt = basePrompt;
        modelUsed = 'none (fallback to original)';
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        enhancedPrompt: enhancedPrompt,
        originalPrompt: basePrompt,
        metadata: {
          model_used: modelUsed,
          tokens_used: tokensUsed
        }
      }
    });
    
  } catch (error) {
    console.error('Prompt enhancement API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to enhance prompt. Please try again.' },
      { status: 500 }
    );
  }
}