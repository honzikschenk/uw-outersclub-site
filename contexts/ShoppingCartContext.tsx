"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price_tu_th: number;
  price_th_tu: number;
  price_week: number;
  image_url?: string;
  selectedDates: {
    from: Date;
    to: Date;
  };
  rentalType: "tu_th" | "th_tu" | "week" | "extended" | "custom";
  price: number;
  breakdown?: string; // Price breakdown explanation for extended rentals
}

interface ShoppingCartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getCartCount: () => number;
  isItemInCart: (itemId: string) => boolean;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export function ShoppingCartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("gearRentalCart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Parse dates back to Date objects
        const cartWithDates = parsedCart.map((item: any) => ({
          ...item,
          selectedDates: {
            from: new Date(item.selectedDates.from),
            to: new Date(item.selectedDates.to),
          },
        }));
        setCartItems(cartWithDates);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        localStorage.removeItem("gearRentalCart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("gearRentalCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      // Check if item already exists in cart
      const existingIndex = prev.findIndex((cartItem) => cartItem.id === item.id);
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      } else {
        // Add new item
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  const isItemInCart = (itemId: string) => {
    return cartItems.some((item) => item.id === itemId);
  };

  return (
    <ShoppingCartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        getTotalPrice,
        getCartCount,
        isItemInCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}

export function useShoppingCart() {
  const context = useContext(ShoppingCartContext);
  if (context === undefined) {
    throw new Error("useShoppingCart must be used within a ShoppingCartProvider");
  }
  return context;
}
