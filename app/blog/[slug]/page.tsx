import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  cover_image_url: string | null;
  published_at: string | null;
  author_name: string | null;
};

export default async function BlogPostPage({ params }: any) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("BlogPost")
    .select("id, slug, title, content_html, cover_image_url, published_at, author_name")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return notFound();

  return (
    <article className="container mx-auto px-4 max-w-3xl py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
      <div className="text-sm text-gray-600 mb-6">
        {post.author_name && <span>By {post.author_name} • </span>}
        {post.published_at && new Date(post.published_at).toLocaleDateString()}
      </div>
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt="" className="w-full rounded-lg mb-6" />
      )}
      <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} />
    </article>
  );
}
