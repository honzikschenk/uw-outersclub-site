"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reserveGearAction } from '@/app/actions'

export default function ProductReservationClient({
  user,
  item,
}: {
  user: any;
  item: any;
}) {
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!selectedRange.from || !selectedRange.to) {
      setError('Please select a valid date range.')
      return
    }
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('userId', user.id)
    formData.set('itemId', item.id)
    formData.set('from', selectedRange.from.toISOString())
    formData.set('to', selectedRange.to.toISOString())
    formData.set('quantity', String(quantity))
    const res = await reserveGearAction(formData)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Reservation successful!')
      router.refresh()
    }
  }

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
        <label className="text-sm font-medium mb-1">Date Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              {selectedRange.from && selectedRange.to
                ? `${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}`
                : selectedRange.from
                  ? selectedRange.from.toLocaleDateString()
                  : "Pick a date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  const diff =
                    (range.to.getTime() - range.from.getTime()) /
                    (1000 * 60 * 60 * 24);
                  if (diff < 2) {
                    setSelectedRange({
                      from: range.from,
                      to: new Date(
                        range.from.getTime() + 2 * 24 * 60 * 60 * 1000
                      ),
                    });
                  } else if (diff > 7) {
                    setSelectedRange({
                      from: range.from,
                      to: new Date(
                        range.from.getTime() + 7 * 24 * 60 * 60 * 1000
                      ),
                    });
                  } else {
                    setSelectedRange({ from: range.from, to: range.to });
                  }
                } else {
                  setSelectedRange({
                    from: range?.from,
                    to: range?.to ?? undefined,
                  });
                }
              }}
              initialFocus
              disabled={(date) => {
                const day = date.getDay();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || (day !== 2 && day !== 4);
              }}
              max={
                selectedRange.from
                  ? new Date(
                      selectedRange.from.getTime() + 7 * 24 * 60 * 60 * 1000
                    ).getTime()
                  : undefined
              }
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="quantity" className="text-sm font-medium mb-1">
          Quantity
        </label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={item.num_available ?? 1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full"
        />
      </div>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      {success && (
        <div className="text-green-600 text-sm text-center">{success}</div>
      )}
      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? "Reserving..." : "Reserve"}
      </Button>
    </form>
  );
}
