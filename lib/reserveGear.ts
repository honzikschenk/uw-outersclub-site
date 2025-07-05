// Use the service client to bypass RLS for administrative operations
import { supabaseService } from "@/utils/supabase/service";
import type { CartItem } from "@/contexts/ShoppingCartContext";

export async function reserveCartItems({
  userId,
  cartItems,
}: {
  userId: string;
  cartItems: CartItem[];
}) {
  const supabase = supabaseService;

  console.log(`[reserveCartItems] Starting reservation for user ${userId} with ${cartItems.length} items`);

  if (!cartItems || cartItems.length === 0) {
    return { error: "No items to reserve." };
  }

  // 1. Check if user has an active membership
  const { data: memberships, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    return { error: "Could not check membership status. Database error." };
  }
  if (!memberships) {
    return { error: "No membership record found. Please contact an admin to set up your membership." };
  }
  if (!memberships.valid) {
    return { error: "Your membership has expired or is not valid. Please contact an admin." };
  }

  // 2. Check if user already has overlapping rentals
  const { data: activeLent, error: lentError } = await supabase
    .from("Lent")
    .select("id, lent_date, due_date, gear_id")
    .eq("user_id", userId);

  if (lentError) return { error: "Could not check active rentals." };

  // Check for overlaps with existing rentals
  for (const cartItem of cartItems) {
    const requestedStart = cartItem.selectedDates.from.getTime();
    const requestedEnd = cartItem.selectedDates.to.getTime();

    const overlap = activeLent?.some((rental: any) => {
      const lentStart = new Date(rental.lent_date).getTime();
      const lentEnd = new Date(rental.due_date).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
    });

    if (overlap) {
      return {
        error: `You already have overlapping rentals for the selected dates.`,
      };
    }
  }

  // 3. Check availability for all items
  for (const cartItem of cartItems) {
    const { data: gears, error: gearError } = await supabase
      .from("Gear")
      .select("num_available")
      .eq("id", cartItem.id)
      .single();

    if (gearError)
      return {
        error: `Could not check availability for ${cartItem.name}.`,
      };
    if (!gears || gears.num_available <= 0) {
      return { error: `${cartItem.name} is not available for reservation.` };
    }

    // Check for overlapping rentals for this specific item
    const { data: overlappingLent, error: overlapError } = await supabase
      .from("Lent")
      .select("id, lent_date, due_date")
      .eq("gear_id", cartItem.id);

    if (overlapError)
      return {
        error: `Could not check availability for ${cartItem.name}.`,
      };

    const requestedStart = cartItem.selectedDates.from.getTime();
    const requestedEnd = cartItem.selectedDates.to.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const overlapCount = (overlappingLent || []).filter((rental: any) => {
      const lentStart = new Date(rental.lent_date).getTime();
      const lentEnd = new Date(rental.due_date).getTime();
      return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
    }).length;

    if (overlapCount >= gears.num_available) {
      return {
        error: `All available units of ${cartItem.name} are already reserved for the selected dates.`,
      };
    }
  }

  // 4. Create all reservations
  const reservations = cartItems.map((cartItem) => ({
    user_id: userId,
    gear_id: cartItem.id,
    lent_date: cartItem.selectedDates.from.toISOString(),
    due_date: cartItem.selectedDates.to.toISOString(),
  }));

  console.log(`[reserveCartItems] Creating reservations:`, JSON.stringify(reservations, null, 2));

  const { error: insertError } = await supabase.from("Lent").insert(reservations);

  if (insertError) {
    console.error(`[reserveCartItems] Insert error:`, insertError);
    return { error: "Could not create reservations." };
  }

  console.log(`[reserveCartItems] Successfully created ${reservations.length} reservations`);

  // 5. Update gear statistics
  for (const cartItem of cartItems) {
    const { data: gear } = await supabase
      .from("Gear")
      .select("total_times_rented, revenue_generated")
      .eq("id", cartItem.id)
      .single();

    if (gear) {
      await supabase
        .from("Gear")
        .update({
          total_times_rented: (gear.total_times_rented || 0) + 1,
          revenue_generated: (gear.revenue_generated || 0) + cartItem.price,
        })
        .eq("id", cartItem.id);
    }
  }

  console.log(`[reserveCartItems] Reservation process completed successfully for user ${userId}`);
  return { success: true };
}
