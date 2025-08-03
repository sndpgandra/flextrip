import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterAI } from '@/lib/ai/openrouter';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { Traveler } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 requests per minute for chat
    const clientIP = request.ip || 'unknown';
    const rateLimitResult = rateLimit(`chat_${clientIP}`, 5, 60000);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before sending another message.',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const validation = ChatRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chat request data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { messages, travelers, sessionId } = validation.data;
    
    // Initialize OpenRouter AI
    const openRouter = new OpenRouterAI();
    
    // Convert messages to the format expected by AI
    const chatMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date().toISOString()
    }));
    
    // Generate AI response
    const aiResponse = await openRouter.generateResponse(chatMessages, travelers as Traveler[]);
    
    // Create response message
    const responseMessage = {
      role: 'assistant' as const,
      content: aiResponse.content,
      timestamp: new Date().toISOString(),
      metadata: {
        model_used: aiResponse.model,
        tokens_used: aiResponse.tokens,
        response_time: Date.now() // This could be more precise
      }
    };
    
    return NextResponse.json({
      success: true,
      data: {
        message: responseMessage,
        remaining_requests: rateLimitResult.remaining
      }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific AI service errors
    if (error instanceof Error && error.message === 'AI service temporarily unavailable') {
      return NextResponse.json(
        { success: false, error: 'AI service is temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}

// POST /api/chat/stream - Streaming chat endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messagesParam = searchParams.get('messages');
    const travelersParam = searchParams.get('travelers');
    const sessionId = searchParams.get('sessionId');
    
    if (!messagesParam || !travelersParam || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    const rateLimitResult = rateLimit(`chat_stream_${clientIP}`, 3, 60000); // Stricter limit for streaming
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    const messages = JSON.parse(messagesParam);
    const travelers = JSON.parse(travelersParam);
    
    const openRouter = new OpenRouterAI();
    
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString()
          }));
          
          const responseStream = await openRouter.generateStreamingResponse(chatMessages, travelers);
          
          for await (const chunk of responseStream) {
            const data = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          
          // Send completion signal
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Chat stream error:', error);
    return NextResponse.json(
      { success: false, error: 'Streaming failed' },
      { status: 500 }
    );
  }
}