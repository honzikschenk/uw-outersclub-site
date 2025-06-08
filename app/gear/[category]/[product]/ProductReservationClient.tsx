"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reserveGearAction } from '@/app/actions'
import { Calendar } from "@/components/ui/calendar";

const RENTAL_OPTIONS = [
	{
		label: "Tuesday to Thursday",
		value: "tu_th",
		getDates: () => {
			// Find next Tuesday and next Thursday
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			let tuesday = new Date(today);
			let thursday = new Date(today);
			while (tuesday.getDay() !== 2) tuesday.setDate(tuesday.getDate() + 1);
			thursday = new Date(tuesday);
			thursday.setDate(tuesday.getDate() + 2);
			return { from: tuesday, to: thursday };
		},
		priceKey: "price_tu_th"
	},
	{
		label: "Thursday to Tuesday",
		value: "th_tu",
		getDates: () => {
			// Find next Thursday and the following Tuesday
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			let thursday = new Date(today);
			while (thursday.getDay() !== 4) thursday.setDate(thursday.getDate() + 1);
			let nextTuesday = new Date(thursday);
			nextTuesday.setDate(thursday.getDate() + 5);
			return { from: thursday, to: nextTuesday };
		},
		priceKey: "price_th_tu"
	},
	{
		label: "Full Week (Tuesday to Tuesday or Thursday to Thursday)",
		value: "week",
		getDates: () => {
			// Find next Tuesday and the following Tuesday
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			let tuesday = new Date(today);
			while (tuesday.getDay() !== 2) tuesday.setDate(tuesday.getDate() + 1);
			let nextTuesday = new Date(tuesday);
			nextTuesday.setDate(tuesday.getDate() + 7);
			return { from: tuesday, to: nextTuesday };
		},
		priceKey: "price_week"
	}
];

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
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	// Helper to check if a range is valid and get price key
	function getRentalTypeAndPrice(range: { from: Date | null; to: Date | null }) {
		if (!range.from || !range.to) return { type: null, priceKey: null };
		const from = range.from;
		const to = range.to;
		const dayFrom = from.getDay();
		const dayTo = to.getDay();
		const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
		// Tuesday to Thursday
		if (dayFrom === 2 && dayTo === 4 && diff === 2) return { type: 'tu_th', priceKey: 'price_tu_th' };
		// Thursday to Tuesday
		if (dayFrom === 4 && dayTo === 2 && diff === 5) return { type: 'th_tu', priceKey: 'price_th_tu' };
		// Tuesday to next Tuesday
		if (dayFrom === 2 && dayTo === 2 && diff === 7) return { type: 'week', priceKey: 'price_week' };
		// Thursday to next Thursday
		if (dayFrom === 4 && dayTo === 4 && diff === 7) return { type: 'week', priceKey: 'price_week' };
		return { type: null, priceKey: null };
	}

	const { type: rentalType, priceKey } = getRentalTypeAndPrice(selectedRange);
	const price = priceKey ? item[priceKey] ?? 'N/A' : null;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		if (!selectedRange.from || !selectedRange.to || !rentalType) {
			setError('Please select a valid rental period.');
			return;
		}
		setLoading(true);
		const formData = new FormData(e.currentTarget);
		formData.set('userId', user.id);
		formData.set('itemId', item.id);
		formData.set('from', selectedRange.from.toISOString());
		formData.set('to', selectedRange.to.toISOString());
		const res = await reserveGearAction(formData);
		setLoading(false);
		if (res.error) {
			setError(res.error);
		} else {
			setSuccess('Reservation successful! Please pay when picking up the item.');
			router.refresh();
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
		<form
			className="mx-auto w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 mt-8"
			onSubmit={handleSubmit}
		>
			<h2 className="text-lg font-semibold text-primary mb-2 text-center">
				Reserve this item
			</h2>
			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium mb-1">Select Rental Period (Tuesday–Thursday, Thursday–Tuesday, or a full week)</label>
				<Calendar
					mode="range"
					selected={{ from: selectedRange.from ?? undefined, to: selectedRange.to ?? undefined }}
					onSelect={(range: { from?: Date; to?: Date } | undefined) => {
						setError(null);
						if (!range?.from) {
							setSelectedRange({ from: null, to: null });
							return;
						}
						// If user picks a single date, just set from
						if (!range.to) {
							setSelectedRange({ from: range.from, to: null });
							return;
						}
						// Only allow valid ranges
						const { type } = getRentalTypeAndPrice({ from: range.from, to: range.to });
						if (type) {
							setSelectedRange({ from: range.from, to: range.to });
						} else {
							setSelectedRange({ from: range.from, to: null });
							setError('Please select a valid rental period: Tuesday–Thursday, Thursday–Tuesday, or a full week.');
						}
					}}
					disabled={(date: Date) => {
						const today = new Date();
						today.setHours(0,0,0,0);
						// Only allow picking a start date that is a Tuesday or Thursday in the future
						// and only allow picking an end date that matches a valid rental period
						if (!selectedRange.from) {
							// Only allow picking a start date that is a future Tuesday or Thursday
							return !date || date < today || (date.getDay() !== 2 && date.getDay() !== 4);
						} else {
							// If a start date is picked, only allow valid end dates
							const from = selectedRange.from;
							const dayFrom = from.getDay();
							const diff = Math.round((date.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
							// Tuesday to Thursday
							if (dayFrom === 2 && date.getDay() === 4 && diff === 2) return false;
							// Thursday to Tuesday
							if (dayFrom === 4 && date.getDay() === 2 && diff === 5) return false;
							// Tuesday to next Tuesday
							if (dayFrom === 2 && date.getDay() === 2 && diff === 7) return false;
							// Thursday to next Thursday
							if (dayFrom === 4 && date.getDay() === 4 && diff === 7) return false;
							// Otherwise, disable
							return true;
						}
					}}
					initialFocus
				/>
				<Button
					type="button"
					variant="outline"
					className="mt-2 w-fit self-end"
					onClick={() => setSelectedRange({ from: null, to: null })}
					disabled={!selectedRange.from && !selectedRange.to}
				>
					Clear selection
				</Button>
			</div>
			{rentalType && price && (
				<div className="text-base text-gray-700">
					Price: <span className="font-semibold">${price}</span>
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
			<Button type="submit" className="w-full mt-2" disabled={loading || !selectedRange.from || !selectedRange.to || !rentalType}>
				{loading ? "Reserving..." : "Reserve"}
			</Button>
		</form>
	);
}
