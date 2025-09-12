import { NextRequest, NextResponse } from "next/server";
import { reserveCartItems } from "@/lib/reserveGear";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { cartItems } = await request.json();

    console.log("Raw cart items:", JSON.stringify(cartItems, null, 2));

    // Get user from session
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Convert date strings back to Date objects
    const processedCartItems = cartItems.map((item: any) => ({
      ...item,
      selectedDates: {
        from: new Date(item.selectedDates.from),
        to: new Date(item.selectedDates.to),
      },
    }));

    console.log(
      "Processed cart items:",
      JSON.stringify(
        processedCartItems.map((item: any) => ({
          ...item,
          selectedDates: {
            from: item.selectedDates.from.toISOString(),
            to: item.selectedDates.to.toISOString(),
          },
        })),
        null,
        2,
      ),
    );

    // Process the reservation
    const result = await reserveCartItems({
      userId: user.id,
      cartItems: processedCartItems,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
