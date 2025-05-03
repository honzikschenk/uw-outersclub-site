'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function ProductReservationClient({ user, item }: { user: any, item: any }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [quantity, setQuantity] = useState<number>(1)

  if (!user) {
    return (
      <div className="mt-6 text-center">
        <Link href="/auth/sign-in">
          <Button variant="secondary">Sign in to reserve</Button>
        </Link>
      </div>
    )
  }

  return (
    <form className="mx-auto w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 mt-8">
      <h2 className="text-lg font-semibold text-primary mb-2 text-center">Reserve this item</h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium mb-1">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              {selectedDate ? selectedDate.toLocaleDateString() : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(day) => setSelectedDate(day || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="quantity" className="text-sm font-medium mb-1">Quantity</label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={item.num_available ?? 1}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full mt-2">Reserve</Button>
    </form>
  )
}
