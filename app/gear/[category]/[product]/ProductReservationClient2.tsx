"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { Badge } from "@/components/ui/badge";

export default function ProductReservationClient({
	user,
	item,
}: {
	user: any;
	item: any;
}) {
	const [selectedRange, setSelectedRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const router = useRouter();
	const { addToCart, isItemInCart, removeFromCart } = useShoppingCart();

	// Helper to check if a range is valid and get price key
	function getRentalTypeAndPrice(range: { from: Date | null; to: Date | null }) {
		if (!range.from || !range.to) return { type: null, priceKey: null };
		const from = range.from;
		const to = range.to;
		const dayFrom = from.getDay();
		const dayTo = to.getDay();
		const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
		// Tuesday to Thursday
		if (dayFrom === 2 && dayTo === 4 && diff === 2) return { type: 'tu_th' as const, priceKey: 'price_tu_th' };
		// Thursday to Tuesday
		if (dayFrom === 4 && dayTo === 2 && diff === 5) return { type: 'th_tu' as const, priceKey: 'price_th_tu' };
		// Tuesday to next Tuesday
		if (dayFrom === 2 && dayTo === 2 && diff === 7) return { type: 'week' as const, priceKey: 'price_week' };
		// Thursday to next Thursday
		if (dayFrom === 4 && dayTo === 4 && diff === 7) return { type: 'week' as const, priceKey: 'price_week' };
		return { type: null, priceKey: null };
	}

	const { type: rentalType, priceKey } = getRentalTypeAndPrice(selectedRange);
	const price = priceKey ? item[priceKey] ?? 0 : 0;
	const itemInCart = isItemInCart(item.id);

	const handleAddToCart = () => {
		if (!selectedRange.from || !selectedRange.to || !rentalType) {
			setError('Please select a valid rental period.');
			return;
		}

		const cartItem = {
			id: item.id,
			name: item.name,
			category: item.category,
			price_tu_th: item.price_tu_th,
			price_th_tu: item.price_th_tu,
			price_week: item.price_week,
			image_url: item.image_url,
			selectedDates: {
				from: selectedRange.from,
				to: selectedRange.to,
			},
			rentalType,
			price,
		};

		addToCart(cartItem);
		setSuccess('Item added to cart!');
		setError(null);
	};

	const handleRemoveFromCart = () => {
		removeFromCart(item.id);
		setSuccess('Item removed from cart!');
		setError(null);
	};

	if (!user) {
		return (
			<div className="mt-6 text-center">
				<Link href="/sign-in">
					<Button variant="secondary">Sign in to reserve</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 mt-8">
			<h2 className="text-lg font-semibold text-primary mb-2 text-center">
				{itemInCart ? "Update Reservation" : "Reserve this item"}
			</h2>
			
			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium mb-1">Select Rental Period</label>
				<Calendar
					mode="range"
					selected={{ from: selectedRange.from ?? undefined, to: selectedRange.to ?? undefined }}
					onSelect={(range: { from?: Date; to?: Date } | undefined) => {
						setError(null);
						setSuccess(null);
						if (!range?.from) {
							setSelectedRange({ from: null, to: null });
							return;
						}
						
						const newRange = { from: range.from, to: range.to || null };
						setSelectedRange(newRange);
						
						// Auto-complete common rental patterns
						if (range.from && !range.to) {
							const dayOfWeek = range.from.getDay();
							let autoTo: Date | null = null;
							
							if (dayOfWeek === 2) { // Tuesday
								// Auto-select Thursday (2 days later)
								autoTo = new Date(range.from);
								autoTo.setDate(autoTo.getDate() + 2);
							} else if (dayOfWeek === 4) { // Thursday
								// Auto-select next Tuesday (5 days later)
								autoTo = new Date(range.from);
								autoTo.setDate(autoTo.getDate() + 5);
							}
							
							if (autoTo) {
								setSelectedRange({ from: range.from, to: autoTo });
							}
						}
					}}
					className="rounded-md border"
					disabled={(date) => date < new Date()}
				/>
			</div>

			{rentalType && price > 0 && (
				<div className="bg-blue-50 border border-blue-300 rounded p-3 text-blue-900 text-center">
					<div className="font-medium">
						{rentalType === 'tu_th' && 'Tuesday to Thursday'}
						{rentalType === 'th_tu' && 'Thursday to Tuesday'}
						{rentalType === 'week' && 'Full Week'}
					</div>
					<div className="text-lg font-bold">${price}</div>
				</div>
			)}

			{selectedRange.from && selectedRange.to && rentalType && (
				<div className="bg-green-50 border border-green-300 rounded p-3 text-green-900 text-center font-medium">
					Rental period: <span className="font-bold">{selectedRange.from.toLocaleDateString()}</span> to <span className="font-bold">{selectedRange.to.toLocaleDateString()}</span>
				</div>
			)}

			{error && <div className="text-red-600 text-sm text-center">{error}</div>}
			{success && (
				<div className="text-green-600 text-sm text-center">{success}</div>
			)}

			{itemInCart ? (
				<div className="space-y-2">
					<Button 
						onClick={handleAddToCart}
						className="w-full" 
						disabled={!selectedRange.from || !selectedRange.to || !rentalType}
					>
						Update Cart
					</Button>
					<Button 
						onClick={handleRemoveFromCart}
						variant="outline"
						className="w-full text-destructive hover:text-destructive"
					>
						Remove from Cart
					</Button>
				</div>
			) : (
				<Button 
					onClick={handleAddToCart}
					className="w-full" 
					disabled={!selectedRange.from || !selectedRange.to || !rentalType}
				>
					Add to Cart
				</Button>
			)}
		</div>
	);
}
