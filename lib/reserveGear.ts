// Use the server client for server-side usage
import { supabaseService } from '@/utils/supabase/service'

export async function reserveGear({ userId, itemId, from, to }: {
  userId: string,
  itemId: string,
  from: Date,
  to: Date
}) {
  const supabase = supabaseService

  // Use the provided from/to dates directly
  if (!from || !to) return { error: 'Could not determine rental period.' }

  // 1. Check if user has an active membership
  const { data: memberships, error: membershipError } = await supabase
    .from('Membership')
    .select('user_id, valid')
    .eq('user_id', userId)
    .maybeSingle()
    
  if (membershipError) return { error: 'Could not check membership status.' }
  if (!memberships) return { error: 'No active membership found.' }
  if (!memberships.valid) return { error: 'Membership expired or not valid.' }

  // 2. Check if user already has an active rental
  const { data: activeLent, error: lentError } = await supabase
    .from('Lent')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (lentError) return { error: 'Could not check active rentals.' }
  if (activeLent && activeLent.length > 0) return { error: 'You already have an item rented.' }

  // 3. Check if item is available
  const { data: gears, error: gearError } = await supabase
    .from('Gear')
    .select('num_available')
    .eq('id', itemId)
    .single()
  if (gearError) return { error: 'Could not check item availability.' }
  if (!gears || gears.num_available <= 0) return { error: 'Item is not available for reservation.' }

  // 4. Insert reservation (assume 'Lent' table)
  const { error: insertError } = await supabase
    .from('Lent')
    .insert({
      user_id: userId,
      gear_id: itemId,
      lent_date: from.toISOString(),
      due_date: to.toISOString(),
    })

  if (insertError) return { error: 'Could not reserve item.' }

  // 5. Decrement num_available in Gear
  const { data: gear } = await supabase
    .from('Gear')
    .select('num_available')
    .eq('id', itemId)
    .single()
  let updateError;
  if (gear && gear.num_available > 0) {
    const { error } = await supabase
      .from('Gear')
      .update({ num_available: gear.num_available - 1 })
      .eq('id', itemId);
    updateError = error;
  }

  if (updateError) return { error: 'Reservation made, but failed to update available amount.' }
  
  return { success: true }
}
