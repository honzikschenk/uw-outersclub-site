import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: event, error } = await supabase
    .from('Events')
    .select('id, name, date, location, description, link')
    .eq('id', params.id)
    .single()

  if (error || !event) {
    return <div className="p-8 text-red-600">Event not found.</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/events" className="hover:underline">Events</Link>
        <span className="mx-2">/</span>
        <span>{event.name}</span>
      </nav>
      <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
      <div className="mb-2 text-muted-foreground">{event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}</div>
      <div className="mb-4">{event.location || 'Location TBA'}</div>
      <div className="mb-6 text-lg leading-relaxed">{event.description || 'No description.'}</div>
      {event.link && (
        <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">External Link</a>
      )}
    </div>
  )
}