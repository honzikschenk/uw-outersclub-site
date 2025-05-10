import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function ResourcesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div className="container mx-auto py-10">
        <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
          <Link href="/resources" className="hover:underline">Resources</Link>
        </nav>
        <h1 className="text-4xl font-bold mb-8">Resources</h1>
        <section className="mb-10">
          <Card className="mb-6 w-full md:w-[800px] mx-auto">
            <CardHeader>
              <CardTitle>Maps</CardTitle>
              <CardDescription>
                Access maps for trip planning and navigation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <iframe
                  src="https://drive.google.com/embeddedfolderview?id=0B3J7fcnwqdthQzVVUy1aVUVRbnM#list"
                  title="Trail and Topographic Maps"
                  width="100%"
                  height="500"
                  className="rounded-md"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </section>
        <section>
          <Card className="w-full md:w-[800px] mx-auto">
            <CardHeader>
              <CardTitle>Trip Planning Resources</CardTitle>
              <CardDescription>
                Useful links and tips for planning your next adventure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <iframe
                  src="https://drive.google.com/embeddedfolderview?id=18Rg-rngkZq_cA9Md9wb6ML2uKkIING1z#list"
                  title="Trip Planning Resources"
                  width="100%"
                  height="500"
                  className="rounded-md"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
