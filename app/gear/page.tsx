import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default async function Page() {
  const supabase = await createClient()
  // Fetch distinct categories from the Gear table
  const { data: categories, error } = await supabase
    .from('Gear')
    .select('category')
    .neq('category', null)
    .neq('category', '')
    .select()

  if (error) {
    return <div className="p-8 text-red-600">Error loading categories: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/gear" className="hover:underline">Gear Categories</Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">Gear Categories</h1>
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.category} href={`/gear/${encodeURIComponent(cat.category)}`}>
              <Card className="shadow-md transition-transform hover:scale-105 cursor-pointer">
                <CardHeader>
                  <CardTitle className="capitalize">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent>
                <Image
                    src={`/categories/${encodeURIComponent(cat.category)}.jpg`} 
                    alt={`${cat.category} image`}
                    width={300}
                    height={300}
                    className="w-full h-80 object-cover rounded-t-md mb-4"
                  />
                  <div className="text-muted-foreground">View all gear in this category</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-lg text-muted-foreground">No categories found.</div>
      )}
    </div>
  )
}
