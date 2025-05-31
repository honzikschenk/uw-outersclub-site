import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import ProductReservationClient from './ProductReservationClient'

export default async function Page({
  params,
}: {
  params: Promise<{ category: string, product: string }>;
}) {
  const { category, product } = await params

  const supabase = await createClient()
  // Fetch product details
  const { data: items, error } = await supabase
    .from('Gear')
    .select('*')
    .eq('category', category)
    .eq('id', product)
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
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/gear" className="hover:underline">Gear Categories</Link>
        <span>/</span>
        <Link href={`/gear/${encodeURIComponent(category)}`} className="hover:underline capitalize">{category}</Link>
        <span>/</span>
        <span>{item.name}</span>
      </nav>
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
          <span className="text-xl font-semibold text-primary">From ${item.price_tu_th ?? 'N/A'}</span>
          <span className="text-base text-gray-500">Available: {item.num_available ?? 'N/A'}</span>
        </div>
        <ProductReservationClient user={user} item={item} />
      </div>
    </div>
  )
}
