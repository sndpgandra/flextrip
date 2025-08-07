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
    const enhancementSystemPrompt = `You are a travel planning assistant that helps enhance user queries to get better travel recommendations. 

Your task is to take a basic travel query and enhance it with specific details that will lead to more personalized and useful recommendations.

Guidelines:
1. Keep the user's original intent and tone
2. Add specific context about the family group, preferences, and travel details
3. Make the query more actionable and specific
4. Ensure it flows naturally and doesn't feel robotic
5. Keep it concise but informative (under 200 words)
6. Don't change the fundamental question, just enhance it with context

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
    
    // Use a direct API call for simple text enhancement (bypass JSON parsing)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'FlexiTrip - Prompt Enhancement'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Use simpler model for text enhancement
        messages: enhancementMessages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to call AI service');
    }

    const aiData = await response.json();
    const enhancedPrompt = aiData.choices[0]?.message?.content || basePrompt;
    
    return NextResponse.json({
      success: true,
      data: {
        enhancedPrompt: enhancedPrompt,
        originalPrompt: basePrompt,
        metadata: {
          model_used: 'openai/gpt-4o-mini',
          tokens_used: aiData.usage?.total_tokens
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