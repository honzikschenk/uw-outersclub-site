import { createClient } from "@/utils/supabase/server";
import ModernGallery from "@/components/GalleryGrid";
import Image from "next/image";

type GalleryRow = {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
  group_id: string | null;
  sequence: number | null;
};

export const metadata = {
  title: "Gallery | UW Outers Club",
};

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("GalleryImage")
  .select("id, title, image_url, created_at, group_id, sequence")
  .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <section className="relative overflow-hidden rounded-2xl bg-gray-900 mb-8">
        <div className="absolute inset-0">
          <Image src="/trips-events.jpg" alt="Trips and events collage" fill priority className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white">Gallery</h1>
          <p className="mt-2 text-sm md:text-base text-white/80 max-w-2xl">Trips, events, and moments from around the club — grouped by caption.</p>
        </div>
      </section>

      {(!images || images.length === 0) && (
        <div className="text-center text-gray-500 py-20">No images yet. Check back soon.</div>
      )}

      {images && images.length > 0 && (
        <ModernGallery images={images} />
      )}
    </div>
  );
}
