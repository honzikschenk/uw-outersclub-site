import Link from 'next/link'

export const metadata = {
  title: "Events | UW Outers Club",
};

export default async function Events() {
  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/events" className="hover:underline">Events</Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
      <div className="p-8 text-red-600">TODO: INSERT GOOGLE CALENDAR</div>
    </div>
  )
 }
