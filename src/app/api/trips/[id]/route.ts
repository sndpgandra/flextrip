import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/supabase';
import { UpdateTripSchema } from '@/lib/validation/schemas';

// GET /api/trips/[id] - Get a specific trip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error || !trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trip
    });
    
  } catch (error) {
    console.error('Trip GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id] - Update a trip
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = UpdateTripSchema.safeParse({ ...body, id: params.id });
    
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
    
    // Remove id from update data
    const { id, ...updateData } = validation.data;
    
    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Trip not found' },
          { status: 404 }
        );
      }
      
      console.error('Error updating trip:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update trip' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trip
    });
    
  } catch (error) {
    console.error('Trip PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting trip:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete trip' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully'
    });
    
  } catch (error) {
    console.error('Trip DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}