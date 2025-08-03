import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/supabase';
import { CreateTripSchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';

// GET /api/trips - Get all trips for a session
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
    
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching trips:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trips' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trips
    });
    
  } catch (error) {
    console.error('Trips GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    const rateLimitResult = rateLimit(`trips_${clientIP}`, 20, 60000); // 20 requests per minute
    
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
    const validation = CreateTripSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid trip data', 
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
    
    // Verify all traveler IDs exist in this session
    if (validation.data.traveler_ids.length > 0) {
      const { data: travelers, error: travelersError } = await supabase
        .from('travelers')
        .select('id')
        .eq('session_id', validation.data.session_id)
        .in('id', validation.data.traveler_ids);
      
      if (travelersError || !travelers || travelers.length !== validation.data.traveler_ids.length) {
        return NextResponse.json(
          { success: false, error: 'Some traveler IDs are invalid' },
          { status: 400 }
        );
      }
    }
    
    // Check trip limit (50 trips per session for free users)
    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', validation.data.session_id);
    
    if (count && count >= 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 trips allowed per session' },
        { status: 400 }
      );
    }
    
    const { data: trip, error } = await supabase
      .from('trips')
      .insert(validation.data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating trip:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create trip' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trip
    }, { status: 201 });
    
  } catch (error) {
    console.error('Trips POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}