"use client";
import Link from "next/link";
import LoadMoreBar from "@/components/ui/load-more-bar";
import { useState } from "react";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function LoadMoreClient({ posts }: { posts: BlogPost[] }) {
  const PAGE_SIZE = 9;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const slice = posts.slice(0, visible);
  const remaining = Math.max(0, posts.length - visible);
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {slice.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block rounded-lg border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
            {post.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover_image_url} alt="" className="h-40 w-full object-cover" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold group-hover:text-primary line-clamp-2">{post.title}</h2>
              {post.excerpt && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{post.excerpt}</p>
              )}
              {post.published_at && (
                <p className="text-xs text-gray-500 mt-3">{new Date(post.published_at).toLocaleDateString()}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      <div className="py-6">
        <LoadMoreBar hasMore={remaining > 0} remaining={remaining} size={PAGE_SIZE} onLoadMore={() => setVisible((v) => v + PAGE_SIZE)} />
      </div>
    </div>
  );
}
