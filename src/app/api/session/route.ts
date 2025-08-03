import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { createServerSupabaseClient } from '@/lib/database/supabase';
import { SessionSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const cookieStore = cookies();
    let sessionId = cookieStore.get('sessionId')?.value;
    
    const supabase = createServerSupabaseClient();
    
    if (!sessionId) {
      // Create new session
      sessionId = uuidv4();
      
      const { error: insertError } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          last_active: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating session:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to create session' },
          { status: 500 }
        );
      }
    } else {
      // Update existing session
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          last_active: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (updateError) {
        console.error('Error updating session:', updateError);
        // Continue anyway, session might still be valid
      }
    }
    
    // Fetch session data with travelers and trips
    const [travelersResult, tripsResult] = await Promise.all([
      supabase
        .from('travelers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }),
      supabase
        .from('trips')
        .select('*')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false })
    ]);
    
    const response = NextResponse.json({
      success: true,
      data: {
        sessionId,
        travelers: travelersResult.data || [],
        trips: tripsResult.data || []
      }
    });
    
    // Set session cookie
    response.cookies.set('sessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SessionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid session data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const sessionId = validation.data.id || uuidv4();
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: sessionId,
        last_active: new Date().toISOString(),
        metadata: validation.data.metadata || {}
      });
    
    if (error) {
      console.error('Error upserting session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create/update session' },
        { status: 500 }
      );
    }
    
    const response = NextResponse.json({
      success: true,
      data: { sessionId }
    });
    
    response.cookies.set('sessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}