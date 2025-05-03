import Hero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
              {/* <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Top-Quality Gear</CardTitle>
                  <CardDescription>Rent from our curated collection of outdoor equipment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src=""
                    alt="Gear Rental"
                    width={400}
                    height={300}
                    className="rounded-md mb-4"
                  />
                  <p className="text-sm text-gray-600">Find everything from durable tents to reliable climbing gear. Quality guaranteed.</p>
                  <Button variant="secondary" asChild>
                    <a href={"/gear"}>Explore Gear</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Manage Your Membership</CardTitle>
                  <CardDescription>Effortlessly handle your profile and club perks.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src=""
                    alt="Membership Management"
                    width={400}
                    height={301}
                    className="rounded-md mb-4"
                  />
                  <p className="text-sm text-gray-600">Keep your information current and view your complete rental history with ease.</p>
                  <Button variant="secondary">Manage Account</Button>
                </CardContent>
              </Card>

              <Card className="shadow-md transition-transform hover:scale-105">
                <CardHeader>
                  <CardTitle>Explore Activities &amp; Events</CardTitle>
                  <CardDescription>Discover and join our exciting outdoor adventures.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src=""
                    alt="Activities and Events"
                    width={400}
                    height={302}
                    className="rounded-md mb-4"
                  />
                  <p className="text-sm text-gray-600">Participate in group hikes, camping trips, and skill-building workshops. Find your adventure.</p>
                  <Button variant="secondary" asChild>
                    <a href={"/activities"}>View Activities</a>
                  </Button>
                </CardContent>
              </Card> */}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
