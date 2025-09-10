import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

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

      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
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
      )}
    </div>
  );
}
