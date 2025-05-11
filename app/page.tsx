import Hero from "@/components/hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Image from "next/image";

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <div>
          <div className="container mx-auto py-10">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Gear Rental</CardTitle>
                  <CardDescription>
                    Rent from our collection of outdoor equipment. Find
                    everything from tents to climbing gear.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Image
                      src="/gear-photo.jpg"
                      alt="Gear Rental"
                      width={180}
                      height={250}
                      className="rounded-md mb-4"
                    />
                  </div>
                  <Button
                    className="transition-transform hover:scale-110 hover:text-gray-600"
                    variant="secondary"
                    asChild
                  >
                    <a href={"/gear"}>Rent Gear</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                  <CardDescription>
                    Use our resources for your own trips.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src="/trail-map.jpg"
                    alt="Resources"
                    width={400}
                    height={301}
                    className="rounded-md mb-4"
                  />
                  <Button
                    className="transition-transform hover:scale-110 hover:text-gray-600"
                    variant="secondary"
                    asChild
                  >
                    <a href={"/resources"}>Explore Resources</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Trips &amp; Events</CardTitle>
                  <CardDescription>
                    Discover and join our exciting outdoor adventures.
                    Participate in group hikes and skill-building workshops.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src="/trips-events.jpg"
                    alt="Trips and Events"
                    width={700}
                    height={302}
                    className="rounded-md mb-4"
                  />
                  <Button
                    className="transition-transform hover:scale-110 hover:text-gray-600"
                    variant="secondary"
                    asChild
                  >
                    <a href={"/events"}>View Activities</a>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
