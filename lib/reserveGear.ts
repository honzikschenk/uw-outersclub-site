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

  console.log(
    `[reserveCartItems] Starting reservation for user ${userId} with ${cartItems.length} items`,
  );

  if (!cartItems || cartItems.length === 0) {
    return { error: "No items to reserve." };
  }

  // 1. Check if user has an active membership (but allow rental to proceed)
  const { data: memberships, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    return { error: "Could not check membership status. Database error." };
  }
  if (!memberships) {
    return {
      error: "No membership record found. Please contact an admin to set up your membership.",
    };
  }
  // Note: We allow rentals to proceed even if membership is not valid
  // The user will be warned at pickup time about membership requirements

  // 2. Check for duplicate items in the current cart
  const gearIdsInCart = cartItems.map((item) => item.id);
  const uniqueGearIds = new Set(gearIdsInCart);

  if (gearIdsInCart.length !== uniqueGearIds.size) {
    return {
      error: "You cannot rent the same item multiple times in one reservation.",
    };
  }

  // 3. Allocate specific gear item instances for each cart item
  //    We pick one available GearItem (admin-managed unique ID) per Gear for the requested dates.
  type ReservationRow = {
    user_id: string;
    gear_id: string | number;
    gear_item_id: string | number;
    lent_date: string;
    due_date: string;
    returned: boolean;
  };

  const reservations: ReservationRow[] = [];
  for (const cartItem of cartItems) {
    const requestedStart = cartItem.selectedDates.from.getTime();
    const requestedEnd = cartItem.selectedDates.to.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // 3a. Ensure the user doesn't already have the same Gear reserved overlapping
    const { data: userRentals, error: userRentalError } = await supabase
      .from("Lent")
      .select("id, lent_date, due_date")
      .eq("gear_id", cartItem.id)
      .eq("user_id", userId)
      .neq("returned", true);

    if (userRentalError)
      return {
        error: `Could not check your existing rentals for ${cartItem.name}.`,
      };

    const userHasOverlap = (userRentals || []).some((rental: any) => {
      const lentStart = new Date(rental.lent_date).getTime();
      const lentEnd = new Date(rental.due_date).getTime();
      return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
    });
    if (userHasOverlap) {
      return {
        error: `You already have ${cartItem.name} rented for overlapping dates.`,
      };
    }

    // 3b. Get all GearItem IDs for this Gear
    const { data: gearItems, error: gearItemsError } = await supabase
      .from("GearItem")
      .select("id")
      .eq("gear_id", cartItem.id)
      .eq("active", true);

    if (gearItemsError) {
      return { error: `Could not load inventory for ${cartItem.name}.` };
    }
    if (!gearItems || gearItems.length === 0) {
      return { error: `No units configured for ${cartItem.name}.` };
    }

    const allItemIds = gearItems.map((gi: any) => gi.id);

    // 3c. Fetch rentals that overlap the requested range for these items
    //     Filter by date window to minimize data, apply precise overlap in app layer.
    const { data: overlappingRentals, error: overlapError } = await supabase
      .from("Lent")
      .select("gear_item_id, lent_date, due_date, returned")
      .in("gear_item_id", allItemIds)
      .neq("returned", true);

    if (overlapError) {
      return { error: `Could not verify availability for ${cartItem.name}.` };
    }

    const reservedIds = new Set(
      (overlappingRentals || [])
        .filter((r: any) => {
          const lentStart = new Date(r.lent_date).getTime();
          const lentEnd = new Date(r.due_date).getTime();
          return requestedStart < lentEnd - oneDay && requestedEnd > lentStart;
        })
        .map((r: any) => r.gear_item_id),
    );

    const availableItemId = allItemIds.find((id: any) => !reservedIds.has(id));
    if (!availableItemId) {
      return {
        error: `All available units of ${cartItem.name} are already reserved for the selected dates.`,
      };
    }

    reservations.push({
      user_id: userId,
      gear_id: cartItem.id,
      gear_item_id: availableItemId,
      lent_date: cartItem.selectedDates.from.toISOString(),
      due_date: cartItem.selectedDates.to.toISOString(),
      returned: false,
    });
  }

  console.log(`[reserveCartItems] Creating reservations:`, JSON.stringify(reservations, null, 2));

  const { error: insertError } = await supabase.from("Lent").insert(reservations as any);

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
