import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/supabase';
import { CreateTravelerSchema, UpdateTravelerSchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';

// GET /api/travelers - Get all travelers for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    const { data: travelers, error } = await supabase
      .from('travelers')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching travelers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch travelers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: travelers
    });
    
  } catch (error) {
    console.error('Travelers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/travelers - Create a new traveler
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    const rateLimitResult = rateLimit(`travelers_${clientIP}`, 10, 60000); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const validation = CreateTravelerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid traveler data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', validation.data.session_id)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }
    
    // Check if we're at the limit (8 travelers max)
    const { count } = await supabase
      .from('travelers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', validation.data.session_id);
    
    if (count && count >= 8) {
      return NextResponse.json(
        { success: false, error: 'Maximum 8 travelers allowed per session' },
        { status: 400 }
      );
    }
    
    const { data: traveler, error } = await supabase
      .from('travelers')
      .insert(validation.data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating traveler:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create traveler' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: traveler
    }, { status: 201 });
    
  } catch (error) {
    console.error('Travelers POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/travelers - Delete all travelers for a session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('travelers')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('Error deleting travelers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete travelers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Travelers deleted successfully'
    });
    
  } catch (error) {
    console.error('Travelers DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}