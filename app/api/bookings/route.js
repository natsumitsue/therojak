import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/bookings?asset_id=xxx (optional filter)
export async function GET(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get('asset_id')
  const mine = searchParams.get('mine')

  let query = supabase
    .from('asset_bookings')
    .select('*, assets(name, category)')
    .order('start_date', { ascending: true })

  if (assetId) query = query.eq('asset_id', assetId)
  if (mine === 'true') query = query.eq('user_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/bookings — create booking
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Check for conflicts — same asset, overlapping dates, active/pending/approved bookings
  const { data: conflicts } = await supabase
    .from('asset_bookings')
    .select('id, quantity, status')
    .eq('asset_id', body.asset_id)
    .in('status', ['pending', 'approved', 'active'])
    .lte('start_date', body.end_date)
    .gte('end_date', body.start_date)

  // Sum up booked quantity in conflicting period
  const bookedQty = (conflicts || []).reduce((sum, b) => sum + b.quantity, 0)

  // Check asset availability
  const { data: asset } = await supabase
    .from('assets')
    .select('available, quantity')
    .eq('id', body.asset_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const remainingQty = asset.quantity - bookedQty
  if (remainingQty < body.quantity) {
    return NextResponse.json({
      error: `Only ${remainingQty} unit(s) available for the selected dates`
    }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('asset_bookings')
    .insert({
      ...body,
      user_id: user.id,
      user_email: user.email,
      status: 'approved', // auto-approve for now
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update asset available count
  await supabase
    .from('assets')
    .update({ available: remainingQty - body.quantity })
    .eq('id', body.asset_id)

  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/bookings — update status (checkout/return/cancel)
export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status, ...rest } = body

  const updates = { status, ...rest }
  if (status === 'active') updates.checked_out_at = new Date().toISOString()
  if (status === 'returned') updates.returned_at = new Date().toISOString()

  const { data: booking, error } = await supabase
    .from('asset_bookings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If returned or cancelled — restore available count
  if (status === 'returned' || status === 'cancelled') {
    const { data: asset } = await supabase
      .from('assets')
      .select('available')
      .eq('id', booking.asset_id)
      .single()

    if (asset) {
      await supabase
        .from('assets')
        .update({ available: asset.available + booking.quantity })
        .eq('id', booking.asset_id)
    }
  }

  return NextResponse.json(booking)
}
