import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface PageProps {
  params: { category: string; product: string }
}

export default async function Page({ params }: PageProps) {
  const supabase = await createClient()
  // Fetch product details
  const { data: items, error } = await supabase
    .from('Gear')
    .select('*')
    .eq('category', params.category)
    .eq('id', params.product)
    .limit(1)

  const { data: { user } } = await supabase.auth.getUser()

  if (error) {
    return <div className="p-8 text-red-600">Error loading product: {error.message}</div>
  }

  const item = items && items.length > 0 ? items[0] : null

  if (!item) {
    return <div className="p-8 text-muted-foreground">Product not found.</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      {item.image_url && (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-6">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}
      <div className="bg-white/90 rounded-lg p-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-1">{item.name}</h1>
          <div className="text-muted-foreground text-base mb-2 capitalize">{item.category}</div>
        </div>
        <div className="mb-2 text-lg text-gray-700 leading-relaxed">
          {item.description}
        </div>
        <div className="flex items-center gap-6 mb-6">
          <span className="text-xl font-semibold text-primary">${item.price ?? 'N/A'}</span>
          <span className="text-base text-gray-500">Available: {item.num_available ?? 'N/A'}</span>
        </div>
        {user ? (
          <form className="flex flex-col gap-4 bg-primary/5 p-4 rounded-md border mt-6">
            <h2 className="text-lg font-semibold mb-2 text-primary">Reserve this item</h2>
            {/* Reservation form fields (e.g., date pickers, quantity) can go here */}
            <Button type="submit" className="w-full">Reserve</Button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <Link href="/auth/sign-in">
              <Button variant="secondary">Sign in to reserve</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
