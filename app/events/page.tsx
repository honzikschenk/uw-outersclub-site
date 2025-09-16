import Link from "next/link";

export const metadata = {
  title: "Events | UW Outers Club",
};

export default async function Events() {
  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/events" className="hover:underline">
          Events
        </Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
      <div className="p-8 text-red-600">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=71730c85c9c972cf042377ab3f0508ae116d9dfcb84dad47b8df05b023dc04e4%40group.calendar.google.com&ctz=America%2FToronto"
          style={{ border: 0 }}
          width="100%"
          height="600"
        ></iframe>
      </div>
    </div>
  );
}
