"use client";

import React, { useState } from 'react';
import { useShoppingCart } from '@/contexts/ShoppingCartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Calendar, MapPin, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const RENTAL_TYPE_LABELS = {
  'tu_th': 'Tuesday to Thursday',
  'th_tu': 'Thursday to Tuesday',
  'week': 'Full Week'
};

export default function CheckoutPage() {
  const { 
    cartItems, 
    removeFromCart, 
    clearCart, 
    getTotalPrice 
  } = useShoppingCart();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCompleteReservation = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to complete your reservation');
        setLoading(false);
        return;
      }

      // Make API call to process checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to complete reservation');
        setLoading(false);
        return;
      }

      // Clear cart and show success
      clearCart();
      setSuccess(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to complete reservation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto py-6 sm:py-10 max-w-2xl px-4">
        <Card className="p-6 sm:p-8 text-center">
          <div className="text-green-600 mb-4">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-green-800">Reservation Successful!</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Your gear has been reserved. Please pick up your items during equipment room hours 
            (5:30-6:30 pm, Tuesdays and Thursdays) at PAC 2010.
          </p>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 inline mr-1" />
              Equipment Room: PAC 2010 (west)
            </p>
            <p className="text-sm text-muted-foreground">
              Remember to bring your WatCard
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/member">
              <Button className="w-full sm:w-auto">View My Rentals</Button>
            </Link>
            <Link href="/gear">
              <Button variant="outline" className="w-full sm:w-auto">Browse More Gear</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-6 sm:py-10 max-w-2xl px-4">
        <Card className="p-6 sm:p-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Add some gear to your cart to get started with your rental.
          </p>
          <Link href="/gear">
            <Button className="w-full sm:w-auto">Browse Gear</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 max-w-4xl px-4">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/gear" className="hover:underline">Gear</Link>
        <span>/</span>
        <span>Checkout</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Review Your Rental</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Items to Rent</h2>
          
          {cartItems.map((item, index) => (
            <Card key={item.id} className="p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4">
                {item.image_url && (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base leading-tight">{item.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                  
                  <div className="mt-2 space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {RENTAL_TYPE_LABELS[item.rentalType]}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm break-words">
                        {item.selectedDates.from.toLocaleDateString()} - {item.selectedDates.to.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end justify-between min-w-0 flex-shrink-0">
                  <p className="font-bold text-base sm:text-lg whitespace-nowrap">${item.price}</p>
                  <div className="flex gap-1">
                    <Link href={`/gear/${item.category}/${item.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700 touch-manipulation"
                        title="Edit rental dates"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive touch-manipulation"
                      title="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{item.name}</span>
                  <span>${item.price}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
                <p className="font-medium text-blue-900 mb-2">Pickup Information:</p>
                <p className="text-blue-800">
                  Equipment Room: PAC 2010 (west)<br />
                  Hours: Tuesdays & Thursdays, 5:30-6:30 PM<br />
                  Payment due at pickup
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800 mb-4">
                {error}
              </div>
            )}

            <Button 
              onClick={handleCompleteReservation}
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Reservation'}
            </Button>

            <Button
              variant="outline"
              onClick={clearCart}
              className="w-full mt-2 text-destructive hover:text-destructive"
              disabled={loading}
            >
              Clear Cart
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
