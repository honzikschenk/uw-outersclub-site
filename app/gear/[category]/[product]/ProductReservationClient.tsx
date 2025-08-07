"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

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
	const [reservingNow, setReservingNow] = useState(false);
	const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
	const router = useRouter();
	const { addToCart, isItemInCart, removeFromCart } = useShoppingCart();

	// Load unavailable dates on component mount
	useEffect(() => {
		loadUnavailableDates();
	}, [item.id]);

	const loadUnavailableDates = async () => {
		try {
			const supabase = createClient();
			
			// Get all existing rentals for this item (excluding returned items)
			const { data: rentals, error } = await supabase
				.from('Lent')
				.select('lent_date, due_date, returned')
				.eq('gear_id', item.id)
				.eq('returned', false);

			if (error) {
				console.error('Error loading rental dates:', error);
				return;
			}

			// Get item availability
			const { data: gearData } = await supabase
				.from('Gear')
				.select('num_available')
				.eq('id', item.id)
				.single();

			if (!gearData) return;

			// Generate list of unavailable dates
			const unavailable: Date[] = [];
			const rentalCounts: { [dateKey: string]: number } = {};

			// Count rentals for each date
			rentals?.forEach((rental) => {
				const start = new Date(rental.lent_date);
				const end = new Date(rental.due_date);
				
				for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					const dateKey = d.toDateString();
					rentalCounts[dateKey] = (rentalCounts[dateKey] || 0) + 1;
				}
			});

			// Mark dates as unavailable if all units are rented
			Object.entries(rentalCounts).forEach(([dateKey, count]) => {
				if (count >= gearData.num_available) {
					unavailable.push(new Date(dateKey));
				}
			});

			setUnavailableDates(unavailable);
		} catch (error) {
			console.error('Error loading availability:', error);
		}
	};

	// Helper to calculate rental price for any period
	function calculateRentalPrice(range: { from: Date | null; to: Date | null }) {
		if (!range.from || !range.to) return { type: null, price: 0, breakdown: null };
		
		const from = range.from;
		const to = range.to;
		const dayFrom = from.getDay();
		const dayTo = to.getDay();
		const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
		
		// Handle traditional rental types first
		// Tuesday to Thursday (2 days)
		if (dayFrom === 2 && dayTo === 4 && diff === 2) {
			return { 
				type: 'tu_th' as const, 
				price: item.price_tu_th ?? 0,
				breakdown: `Tuesday–Thursday (${diff} days)`
			};
		}
		// Thursday to Tuesday (5 days)
		if (dayFrom === 4 && dayTo === 2 && diff === 5) {
			return { 
				type: 'th_tu' as const, 
				price: item.price_th_tu ?? 0,
				breakdown: `Thursday–Tuesday (${diff} days)`
			};
		}
		// Exact week (7 days)
		if ((dayFrom === 2 && dayTo === 2 && diff === 7) || (dayFrom === 4 && dayTo === 4 && diff === 7)) {
			return { 
				type: 'week' as const, 
				price: item.price_week ?? 0,
				breakdown: `Full week (${diff} days)`
			};
		}
		
		// Handle longer periods with stacked pricing
		if (diff > 7) {
			const weeklyPrice = item.price_week ?? 0;
			const tuThPrice = item.price_tu_th ?? 0;
			const thTuPrice = item.price_th_tu ?? 0;
			
			if (weeklyPrice === 0) return { type: null, price: 0, breakdown: null };
			
			const fullWeeks = Math.floor(diff / 7);
			const remainingDays = diff % 7;
			
			let totalPrice = fullWeeks * weeklyPrice;
			let breakdown = `${fullWeeks} week${fullWeeks > 1 ? 's' : ''} × $${weeklyPrice}`;
			
			// Handle remaining days
			if (remainingDays > 0) {
				let extraPrice = 0;
				let extraDescription = '';
				
				// Choose the best pricing for remaining days
				if (remainingDays <= 2 && tuThPrice > 0) {
					extraPrice = tuThPrice;
					extraDescription = `+ ${remainingDays} extra day${remainingDays > 1 ? 's' : ''} (Tu-Th rate) × $${tuThPrice}`;
				} else if (remainingDays <= 5 && thTuPrice > 0) {
					extraPrice = thTuPrice;
					extraDescription = `+ ${remainingDays} extra day${remainingDays > 1 ? 's' : ''} (Th-Tu rate) × $${thTuPrice}`;
				} else {
					// For 6+ remaining days, charge another full week
					extraPrice = weeklyPrice;
					extraDescription = `+ ${remainingDays} extra day${remainingDays > 1 ? 's' : ''} (week rate) × $${weeklyPrice}`;
				}
				
				totalPrice += extraPrice;
				breakdown += ` ${extraDescription}`;
			}
			
			return {
				type: 'extended' as const,
				price: totalPrice,
				breakdown: `${breakdown} = $${totalPrice} (${diff} days total)`
			};
		}
		
		// For periods less than 7 days that don't match standard patterns
		if (diff > 0 && diff < 7) {
			const tuThPrice = item.price_tu_th ?? 0;
			const thTuPrice = item.price_th_tu ?? 0;
			const weekPrice = item.price_week ?? 0;
			
			// Choose the most appropriate rate
			let price = 0;
			let rateType = '';
			
			if (diff <= 2 && tuThPrice > 0) {
				price = tuThPrice;
				rateType = 'Tu-Th rate';
			} else if (diff <= 5 && thTuPrice > 0) {
				price = thTuPrice;
				rateType = 'Th-Tu rate';
			} else if (weekPrice > 0) {
				price = weekPrice;
				rateType = 'week rate';
			}
			
			if (price > 0) {
				return {
					type: 'custom' as const,
					price,
					breakdown: `${diff} day${diff > 1 ? 's' : ''} (${rateType}) = $${price}`
				};
			}
		}
		
		return { type: null, price: 0, breakdown: null };
	}

	const { type: rentalType, price, breakdown } = calculateRentalPrice(selectedRange);
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
			breakdown,
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

	const handleReserveNow = async () => {
		if (!selectedRange.from || !selectedRange.to || !rentalType) {
			setError('Please select a valid rental period.');
			return;
		}

		if (!user) {
			setError('Please sign in to make a reservation.');
			return;
		}

		setReservingNow(true);
		setError(null);
		setSuccess(null);

		try {
			// Create a single-item cart for immediate reservation
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
				breakdown,
			};

			// Use the same checkout API as the cart
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					cartItems: [cartItem],
				}),
			});

			const result = await response.json();

			if (!response.ok || result.error) {
				setError(result.error || 'Failed to create reservation');
				setReservingNow(false);
				return;
			}

			setSuccess('Reservation successful! Please pick up your gear during equipment room hours.');
			setSelectedRange({ from: null, to: null });
			// Reload unavailable dates
			loadUnavailableDates();
		} catch (err: any) {
			setError(err.message || 'Failed to create reservation');
		} finally {
			setReservingNow(false);
		}
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
		<div className="mx-auto w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4 mt-8">
			<h2 className="text-lg font-semibold text-primary mb-2 text-center">
				{itemInCart ? "Update Reservation" : "Reserve this item"}
			</h2>
			
			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium mb-1">Select Rental Period</label>
				<div className="flex justify-center">
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
									// Auto-select Thursday (2 days later) as default
									autoTo = new Date(range.from);
									autoTo.setDate(autoTo.getDate() + 2);
								} else if (dayOfWeek === 4) { // Thursday
									// Auto-select next Tuesday (5 days later) as default
									autoTo = new Date(range.from);
									autoTo.setDate(autoTo.getDate() + 5);
								}
								
								if (autoTo) {
									setSelectedRange({ from: range.from, to: autoTo });
								}
							}
						}}
						className="rounded-md border w-fit max-w-full overflow-x-auto"
					disabled={(date) => {
						// Disable past dates
						if (date < new Date()) return true;
						
						// Only allow Tuesdays (2) and Thursdays (4)
						const dayOfWeek = date.getDay();
						if (dayOfWeek !== 2 && dayOfWeek !== 4) return true;
						
						// If we have a start date, allow dates up to 4 weeks from the start date
						if (selectedRange.from) {
							const fourWeeksFromStart = new Date(selectedRange.from);
							fourWeeksFromStart.setDate(fourWeeksFromStart.getDate() + 28);
							if (date > fourWeeksFromStart) return true;
						}
						
						// Disable unavailable dates
						return unavailableDates.some(unavailableDate => 
							date.toDateString() === unavailableDate.toDateString()
						);
					}}
					/>
				</div>
			</div>

			{rentalType && price > 0 && (
				<div className="bg-blue-50 border border-blue-300 rounded p-3 text-blue-900 text-center">
					<div className="font-medium">
						{rentalType === 'tu_th' && 'Tuesday to Thursday'}
						{rentalType === 'th_tu' && 'Thursday to Tuesday'}
						{rentalType === 'week' && 'Full Week'}
						{rentalType === 'extended' && 'Extended Rental'}
						{rentalType === 'custom' && 'Custom Period'}
					</div>
					<div className="text-lg font-bold">${price}</div>
					{breakdown && (
						<div className="text-xs mt-1 text-blue-700 leading-tight">
							{breakdown}
						</div>
					)}
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
					<div className="text-center text-sm text-muted-foreground py-2">
						or
					</div>
					<Button 
						onClick={handleReserveNow}
						variant="secondary"
						className="w-full" 
						disabled={!selectedRange.from || !selectedRange.to || !rentalType || reservingNow}
					>
						{reservingNow ? 'Reserving...' : 'Reserve Now'}
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					<Button 
						onClick={handleAddToCart}
						className="w-full" 
						disabled={!selectedRange.from || !selectedRange.to || !rentalType}
					>
						Add to Cart
					</Button>
					<div className="text-center text-sm text-muted-foreground py-2">
						or
					</div>
					<Button 
						onClick={handleReserveNow}
						variant="secondary"
						className="w-full" 
						disabled={!selectedRange.from || !selectedRange.to || !rentalType || reservingNow}
					>
						{reservingNow ? 'Reserving...' : 'Reserve Now'}
					</Button>
				</div>
			)}
		</div>
	);
}
