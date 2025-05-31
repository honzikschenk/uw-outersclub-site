import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params

  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from('Gear')
    .select('*')
    .eq('category', category)

  if (error) {
    return <div className="p-8 text-red-600">Error loading gear: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/gear" className="hover:underline">Gear Categories</Link>
        <span>/</span>
        <span className="capitalize">{category}</span>
      </nav>
      <h1 className="text-4xl font-bold mb-8 capitalize">{category}</h1>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="shadow-md transition-transform hover:scale-105">
              <a href={`/gear/${category}/${item.id}`} className="block">
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.image_url && (
                <div className="flex justify-center mb-4">
                  <Image
                src={item.image_url}
                alt={item.name}
                width={180}
                height={180}
                className="rounded-md"
                  />
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-2">
                {item.description.length > 100
                  ? `${item.description.slice(0, 100)}...`
                  : item.description}
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xl font-semibold text-primary">From ${item.price_tu_th ?? 'N/A'}</span>
                <span className="text-base text-gray-500">Available: {item.num_available ?? 'N/A'}</span>
              </div>
            </CardContent>
              </a>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-lg text-muted-foreground">No gear found in this category.</div>
      )}
    </div>
  )
}
