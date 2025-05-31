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
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	// Determine which rental options are valid for the selected date
	let validOptions = RENTAL_OPTIONS;
	if (selectedDate) {
		const day = selectedDate.getDay();
		if (day === 2) {
			// Tuesday: allow tu_th and week
			validOptions = RENTAL_OPTIONS.filter(opt => opt.value === 'tu_th' || opt.value === 'week');
		} else if (day === 4) {
			// Thursday: allow th_tu and week
			validOptions = RENTAL_OPTIONS.filter(opt => opt.value === 'th_tu' || opt.value === 'week');
		} else {
			validOptions = [];
		}
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		if (!selectedDate || !selectedOption) {
			setError('Please select a valid start date and rental period.');
			return;
		}
		// Calculate from/to based on selected date and option
		let from = new Date(selectedDate);
		let to = new Date(selectedDate);
		if (selectedOption === 'tu_th') {
			to.setDate(from.getDate() + 2);
		} else if (selectedOption === 'th_tu') {
			to.setDate(from.getDate() + 5);
		} else if (selectedOption === 'week') {
			to.setDate(from.getDate() + 7);
		}
		setLoading(true);
		const formData = new FormData(e.currentTarget);
		formData.set('userId', user.id);
		formData.set('itemId', item.id);
		formData.set('from', from.toISOString());
		formData.set('to', to.toISOString());
		formData.set('rentalType', selectedOption);
		const res = await reserveGearAction(formData);
		setLoading(false);
		if (res.error) {
			setError(res.error);
		} else {
			setSuccess('Reservation successful!');
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

	// Determine price
	let price = 'N/A';
	if (selectedOption) {
		const opt = RENTAL_OPTIONS.find(o => o.value === selectedOption);
		price = item[opt?.priceKey ?? 'price_tu_th'] ?? 'N/A';
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
				<label className="text-sm font-medium mb-1">Start Date (Tuesday or Thursday)</label>
				<Calendar
					mode="single"
					selected={selectedDate ?? undefined}
					onSelect={date => {
						setSelectedDate(date ?? null);
						setSelectedOption(null);
					}}
					disabled={date => {
						const today = new Date();
						today.setHours(0,0,0,0);
						return !date || date < today || (date.getDay() !== 2 && date.getDay() !== 4);
					}}
					initialFocus
				/>
			</div>
			{selectedDate && (
				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium mb-1">Rental Period</label>
					<select
						className="border rounded px-3 py-2"
						value={selectedOption ?? ''}
						onChange={e => setSelectedOption(e.target.value)}
						aria-label="Rental Period"
						title="Rental Period"
					>
						<option value="" disabled>Select rental period</option>
						{validOptions.map(opt => (
							<option key={opt.value} value={opt.value}>{opt.label}</option>
						))}
					</select>
				</div>
			)}
			{selectedOption && (
				<div className="text-base text-gray-700">
					Price: <span className="font-semibold">${price}</span>
				</div>
			)}
			{selectedDate && selectedOption && (() => {
  let from = new Date(selectedDate);
  let to = new Date(selectedDate);
  if (selectedOption === 'tu_th') {
    to.setDate(from.getDate() + 2);
  } else if (selectedOption === 'th_tu') {
    to.setDate(from.getDate() + 5);
  } else if (selectedOption === 'week') {
    to.setDate(from.getDate() + 7);
  }
  return (
    <div className="bg-green-50 border border-green-300 rounded p-3 text-green-900 text-center font-medium">
      Rental period: <span className="font-bold">{from.toLocaleDateString()}</span> to <span className="font-bold">{to.toLocaleDateString()}</span>
    </div>
  );
})()}
			{error && <div className="text-red-600 text-sm text-center">{error}</div>}
			{success && (
				<div className="text-green-600 text-sm text-center">{success}</div>
			)}
			<Button type="submit" className="w-full mt-2" disabled={loading || !selectedDate || !selectedOption}>
				{loading ? "Reserving..." : "Reserve"}
			</Button>
		</form>
	);
}
