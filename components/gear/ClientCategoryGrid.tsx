"use client";
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import LoadMoreBar from '@/components/ui/load-more-bar';

export default function ClientCategoryGrid({ items, category }: { items: any[]; category: string }) {
  const PAGE_SIZE = 12;
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const slice = items.slice(0, visible);
  const remaining = Math.max(0, items.length - visible);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {slice.map((item) => (
          <Card key={item.id} className="shadow-md transition-transform hover:scale-105">
            <a href={`/gear/${encodeURIComponent(category)}/${item.id}`} className="block">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.image_url && (
                  <div className="flex justify-center mb-4">
                    <Image src={item.image_url} alt={item.name} width={180} height={180} className="rounded-md" />
                  </div>
                )}
                {typeof item.description === 'string' && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {item.description.length > 100 ? `${item.description.slice(0, 100)}...` : item.description}
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <span className="text-xl font-semibold text-primary">From ${item.price_tu_th ?? 'N/A'}</span>
                  <span className="text-base text-gray-500">Available: {item.num_available ?? 'N/A'}</span>
                </div>
              </CardContent>
            </a>
          </Card>
        ))}
      </div>
      <div className="py-6">
        <LoadMoreBar hasMore={remaining > 0} remaining={remaining} size={PAGE_SIZE} onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
      </div>
    </>
  );
}
