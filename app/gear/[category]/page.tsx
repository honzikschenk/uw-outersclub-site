import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Image from 'next/image'

interface PageProps {
  params: { category: string }
}

export default async function Page({ params }: PageProps) {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from('Gear')
    .select('*')
    .eq('category', params.category)

  if (error) {
    return <div className="p-8 text-red-600">Error loading gear: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 capitalize">{params.category}</h1>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="shadow-md transition-transform hover:scale-105">
              <a href={`/gear/${params.category}/${item.id}`} className="block">
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
              <div className="text-sm text-muted-foreground mb-2">{item.description}</div>
              <div className="font-medium">Amount available: {item.num_available ?? 'N/A'}</div>
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
