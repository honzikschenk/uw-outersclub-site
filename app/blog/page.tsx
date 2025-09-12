import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import LoadMoreClient from "./partials/LoadMoreClient";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export const metadata = {
  title: "Blog | UW Outers Club",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("BlogPost")
    .select("id, slug, title, excerpt, cover_image_url, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="py-10 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Blog</h1>
      </div>

      {(!posts || posts.length === 0) && (
        <div className="text-center text-gray-500 py-20">No posts yet. Check back soon.</div>
      )}

      {posts && posts.length > 0 && <LoadMoreClient posts={posts} />}
    </div>
  );
}
