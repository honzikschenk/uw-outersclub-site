"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export type GalleryImage = {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
  group_id?: string | null;
  sequence?: number | null;
};

type Group = {
  key: string;
  caption: string | null;
  items: GalleryImage[];
  latestAt: number;
};

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const groups = useMemo(() => groupImages(images), [images]);
  const [open, setOpen] = useState(false);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(0);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [carouselApi, setCarouselApi] = useState<any | null>(null);

  const openGroup = (gIndex: number, startAt = 0) => {
    setActiveGroupIdx(gIndex);
    setActiveIdx(startAt);
    setOpen(true);
  };

  const close = () => setOpen(false);
  const next = useCallback(() => {
    if (carouselApi) carouselApi.scrollNext();
  }, [carouselApi]);
  const prev = useCallback(() => {
    if (carouselApi) carouselApi.scrollPrev();
  }, [carouselApi]);

  // keyboard handling inside lightbox (Escape only; let carousel handle arrows)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Sync activeIdx with carousel selection
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setActiveIdx(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);
    return () => {
      try {
        carouselApi.off('select', onSelect);
        carouselApi.off('reInit', onSelect);
      } catch {}
    };
  }, [carouselApi]);

  return (
    <div className="space-y-8">
      {/* Group cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g, gi) => (
          <article
            key={g.key}
    className="group rounded-xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer"
            onClick={() => openGroup(gi, 0)}
          >
            <GroupCollage images={g.items} />
    <div className="p-4 flex items-center justify-between">
      <h3 className="text-base font-semibold text-gray-900 truncate">
                {g.caption || "Untitled Trip"}
              </h3>
      <span className="text-xs text-gray-500">{g.items.length} photo{g.items.length === 1 ? "" : "s"}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[96vw] sm:rounded-xl p-0 overflow-hidden bg-black text-white">
          <div className="relative">
            <div className="relative aspect-[16/10] bg-black">
              <Carousel opts={{ align: "start" }} className="absolute inset-0" setApi={setCarouselApi}>
                <CarouselContent className="h-full">
                  {groups[activeGroupIdx]?.items.map((it, i) => (
                    <CarouselItem key={it.id} className="h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image_url} alt={it.title || ""} className="h-full w-full object-contain bg-black" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className="left-3 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                />
                <CarouselNext
                  className="right-3 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                />
              </Carousel>
              {/* Bottom overlay with caption and thumbnails */}
              <div className="absolute bottom-0 inset-x-0 z-20 bg-black/40 text-white">
                <div className="text-sm px-3 py-2 flex items-center justify-between">
                  <div className="truncate pr-4">{groups[activeGroupIdx]?.caption}</div>
                  <div>
                    {activeIdx + 1} / {groups[activeGroupIdx]?.items.length || 0}
                  </div>
                </div>
                <div className="px-3 pb-3 pt-2">
                  <Carousel opts={{ align: "start" }}>
                    <CarouselContent>
                      {groups[activeGroupIdx]?.items.map((it, i) => (
                        <CarouselItem key={it.id} className="basis-[100px]">
                          <button
                            aria-label={`Go to image ${i + 1}`}
                            onClick={() => { setActiveIdx(i); carouselApi?.scrollTo(i); }}
                            className={`relative aspect-square overflow-hidden rounded border ${i === activeIdx ? "ring-2 ring-blue-500" : "hover:opacity-90"}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.image_url} alt={it.title || ""} className="h-full w-full object-cover" />
                          </button>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

//

function GroupCollage({ images }: { images: GalleryImage[] }) {
  const first = images[0];
  if (!first) return null;
  return (
    <div className="relative aspect-[16/10] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={first.image_url}
        alt={first.title || ""}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

function groupImages(images: GalleryImage[]): Group[] {
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const map = new Map<string, GalleryImage[]>();
  for (const img of images) {
    const key = img.group_id || (img.title ? `t:${normalize(img.title)}` : `solo:${img.id}`);
    const arr = map.get(key) || [];
    arr.push(img);
    map.set(key, arr);
  }
  const groups: Group[] = Array.from(map.entries()).map(([key, arr]) => {
    const sorted = [...arr].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const caption = sorted.find((i) => i.title)?.title || null;
    const latestAt = Math.max(...sorted.map((i) => new Date(i.created_at).getTime()));
    return { key, items: sorted, caption, latestAt };
  });
  groups.sort((a, b) => b.latestAt - a.latestAt);
  return groups;
}
