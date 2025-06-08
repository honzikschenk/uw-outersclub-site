// Use the server client for server-side usage
import { supabaseService } from "@/utils/supabase/service";

export async function reserveGear({
  userId,
  itemId,
  from,
  to,
}: {
  userId: string;
  itemId: string;
  from: Date;
  to: Date;
}) {
  const supabase = supabaseService;

  // Use the provided from/to dates directly
  if (!from || !to) return { error: "Could not determine rental period." };

  // 1. Check if user has an active membership
  const { data: memberships, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) return { error: "Could not check membership status." };
  if (!memberships) return { error: "No active membership found." };
  if (!memberships.valid) return { error: "Membership expired or not valid." };

  // 2. Check if user already has an active rental that overlaps with the requested period
  const { data: activeLent, error: lentError } = await supabase
    .from("Lent")
    .select("id, lent_date, due_date")
    .eq("user_id", userId);

  if (lentError) return { error: "Could not check active rentals." };
  if (activeLent && activeLent.length > 0) {
    // Check for overlap
    const requestedStart = from.getTime();
    const requestedEnd = to.getTime();
    const overlap = activeLent.some((item: any) => {
      const lentStart = new Date(item.lent_date).getTime();
      const lentEnd = new Date(item.due_date).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
    });
    if (overlap)
      return {
        error: "You already have an item rented for overlapping dates.",
      };
  }

  // 3. Check if item is available for the requested period (not just overall stock)
  const { data: gears, error: gearError } = await supabase
    .from("Gear")
    .select("num_available")
    .eq("id", itemId)
    .single();
  if (gearError) return { error: "Could not check item availability." };
  if (!gears || gears.num_available <= 0)
    return { error: "Item is not available for reservation." };

  // Check for overlapping rentals for this item
  const { data: overlappingLent, error: overlapError } = await supabase
    .from("Lent")
    .select("id, lent_date, due_date")
    .eq("gear_id", itemId);

  if (overlapError) return { error: "Could not check item rental overlap." };
  const requestedStart = from.getTime();
  const requestedEnd = to.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const overlapCount = (overlappingLent || []).filter((item: any) => {
    const lentStart = new Date(item.lent_date).getTime();
    const lentEnd = new Date(item.due_date).getTime();
    return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
  }).length;
  if (overlapCount >= gears.num_available) {
    return {
      error: "All available items are already reserved for the selected dates.",
    };
  }

  // 4. Insert reservation (assume 'Lent' table)
  const { error: insertError } = await supabase.from("Lent").insert({
    user_id: userId,
    gear_id: itemId,
    lent_date: from.toISOString(),
    due_date: to.toISOString(),
  });

  if (insertError) return { error: "Could not reserve item." };

  // 5. Decrement num_available in Gear
  const { data: gear } = await supabase
    .from("Gear")
    .select(
      "total_times_rented, revenue_generated, price_week, price_tu_th, price_th_tu"
    )
    .eq("id", itemId)
    .single();
  let updateError;
  if (gear) {
    // Calculate price based on rental period
    let price = 0;
    const msInDay = 24 * 60 * 60 * 1000;
    const startDay = from.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const days = Math.ceil((to.getTime() - from.getTime()) / msInDay);

    if (days >= 7) {
      price = gear.price_week;
    } else if (startDay === 2 && days === 2) {
      // Tuesday (2) to Thursday (4)
      price = gear.price_tu_th;
    } else if (startDay === 4 && days === 5) {
      // Thursday (4) to Tuesday (2)
      price = gear.price_th_tu;
    }

    const { error } = await supabase
      .from("Gear")
      .update({
        total_times_rented: gear.total_times_rented + 1,
        revenue_generated: gear.revenue_generated + price,
      })
      .eq("id", itemId);
    updateError = error;
  }

  if (updateError)
    return {
      error: "Reservation made, but failed to update available amount.",
    };

  return { success: true };
}
