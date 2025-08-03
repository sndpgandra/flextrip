import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/supabase';
import { UpdateTravelerSchema } from '@/lib/validation/schemas';

// GET /api/travelers/[id] - Get a specific traveler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: traveler, error } = await supabase
      .from('travelers')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error || !traveler) {
      return NextResponse.json(
        { success: false, error: 'Traveler not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: traveler
    });
    
  } catch (error) {
    console.error('Traveler GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/travelers/[id] - Update a traveler
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = UpdateTravelerSchema.safeParse({ ...body, id: params.id });
    
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
    
    // Remove id from update data
    const { id, ...updateData } = validation.data;
    
    const { data: traveler, error } = await supabase
      .from('travelers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Traveler not found' },
          { status: 404 }
        );
      }
      
      console.error('Error updating traveler:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update traveler' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: traveler
    });
    
  } catch (error) {
    console.error('Traveler PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/travelers/[id] - Delete a traveler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('travelers')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting traveler:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete traveler' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Traveler deleted successfully'
    });
    
  } catch (error) {
    console.error('Traveler DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}