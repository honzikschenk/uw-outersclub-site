"use client";

import React from "react";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart, Edit } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";

const RENTAL_TYPE_LABELS = {
  tu_th: "Tuesday to Thursday",
  th_tu: "Thursday to Tuesday",
  week: "Full Week",
  extended: "Extended Rental",
  custom: "Custom Period",
};

export function ShoppingCartIcon() {
  const { getCartCount } = useShoppingCart();
  const count = getCartCount();

  return (
    <div className="relative" role="img" aria-label={`Shopping cart with ${count} items`}>
      <ShoppingCart className="h-6 w-6" aria-hidden="true" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          aria-label={`${count} items in cart`}
        >
          {count}
        </Badge>
      )}
    </div>
  );
}

export function ShoppingCartSheet() {
  const { cartItems } = useShoppingCart();
  const [open, setOpen] = React.useState(false);

  const handleEditClick = () => {
    setOpen(false); // Close the sheet when navigating to edit
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Open shopping cart with ${cartItems.length} items`}
        >
          <ShoppingCartIcon />
          <span className="ml-2 hidden sm:inline">Cart</span>
        </Button>
      </SheetTrigger>{" "}
      <SheetContent className="w-[350px] sm:w-[400px] lg:w-[540px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Rental Cart ({cartItems.length} items)</SheetTitle>
          <SheetDescription>Review your selected gear rentals</SheetDescription>
        </SheetHeader>

        <CartContent onEditClick={handleEditClick} />
      </SheetContent>
    </Sheet>
  );
}

// Mobile floating action button for cart
export function MobileCartButton() {
  const { getCartCount } = useShoppingCart();
  const count = getCartCount();
  const [open, setOpen] = React.useState(false);

  // Only show if there are items in cart
  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
            aria-label={`Open shopping cart with ${count} items`}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" aria-hidden="true" />
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-white text-primary border-2 border-primary font-semibold"
                aria-label={`${count} items in cart`}
              >
                {count}
              </Badge>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[350px] sm:w-[400px] lg:w-[540px] max-w-[90vw]">
          <SheetHeader>
            <SheetTitle>Rental Cart ({count} items)</SheetTitle>
            <SheetDescription>Review your selected gear rentals</SheetDescription>
          </SheetHeader>

          <CartContent onEditClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Extract cart content into reusable component
function CartContent({ onEditClick }: { onEditClick?: () => void }) {
  const { cartItems, removeFromCart, clearCart, getTotalPrice } = useShoppingCart();

  return (
    <div className="mt-6 flex-1 overflow-y-auto">
      {cartItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <p className="font-medium">Your cart is empty</p>
          <p className="text-sm">Add some gear to get started!</p>
        </div>
      ) : (
        <div className="space-y-4" aria-label="Items in your cart">
          {cartItems.map((item) => (
            <Card
              key={item.id}
              className="p-4"
              role="article"
              aria-labelledby={`item-${item.id}-name`}
            >
              <div className="flex gap-3">
                {item.image_url && (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={`${item.name} product image`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight" id={`item-${item.id}-name`}>
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  <div className="mt-2 space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {RENTAL_TYPE_LABELS[item.rentalType]}
                    </Badge>
                    <p
                      className="text-xs text-muted-foreground leading-tight"
                      aria-label={`Rental dates from ${item.selectedDates.from.toLocaleDateString()} to ${item.selectedDates.to.toLocaleDateString()}`}
                    >
                      {item.selectedDates.from.toLocaleDateString()} -{" "}
                      {item.selectedDates.to.toLocaleDateString()}
                    </p>
                    {item.breakdown && (
                      <p className="text-xs text-muted-foreground leading-tight">
                        {item.breakdown}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end justify-between min-w-0 flex-shrink-0">
                  <p
                    className="font-semibold text-sm whitespace-nowrap"
                    aria-label={`Price: $${item.price}`}
                  >
                    ${item.price}
                  </p>
                  <div className="flex gap-1" role="group" aria-labelledby={`item-${item.id}-name`}>
                    <Link href={`/gear/${item.category}/${item.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEditClick}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Edit rental dates for ${item.name}`}
                        title="Edit rental dates"
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive touch-manipulation focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label={`Remove ${item.name} from cart`}
                      title="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cart Footer with Total and Actions */}
      {cartItems.length > 0 && (
        <div className="mt-6 border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">${getTotalPrice()}</span>
          </div>

          <div className="space-y-2">
            <Link href="/checkout" className="block">
              <Button
                className="w-full"
                size="lg"
                onClick={onEditClick}
                aria-label={`Proceed to checkout with ${cartItems.length} items totaling $${getTotalPrice()}`}
              >
                Proceed to Checkout (${getTotalPrice()})
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="w-full"
              aria-label="Clear all items from cart"
            >
              Clear Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
