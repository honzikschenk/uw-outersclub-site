import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default async function Events() {
  const supabase = await createClient()
  // Fetch events from the Events table
  const { data: events, error } = await supabase
    .from('Events')
    .select('id, name, date, location, description, link')
    .order('date', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-600">Error loading events: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/events" className="hover:underline">Events</Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block">
              <Card className="shadow-md h-full">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground mb-2">{event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}</div>
                  <div className="mb-2">{event.location || 'Location TBA'}</div>
                  <div className="text-sm text-gray-700 leading-relaxed mb-2">{event.description || 'No description.'}</div>
                  {event.link && (
                    <span className="text-primary underline">External Link</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-lg text-muted-foreground">No upcoming events found.</div>
      )}
    </div>
  )
 }
