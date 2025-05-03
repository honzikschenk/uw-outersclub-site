import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";
import Image from "next/image";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <section className="relative h-[80vh] flex items-center justify-center bg-gray-100 overflow-hidden">
      <Image
        src="/hero.jpg"
        alt="Hero Image"
        className="absolute object-cover w-full h-full blur-sm brightness-75"
        width={1920}
        height={1080}
        priority
      />
      <div className="relative z-10 m-4 text-center text-white">
        <h1 className="text-5xl font-bold mb-4">University of Waterloo Outers Club</h1>
        <p className="text-lg mb-8">Join us on our next adventure!</p>
        <Button size="lg">
          <a href="/sign-up" className="flex items-center gap-2">
            Join Us
          </a>
        </Button>
      </div>
    </section>
  );
}
