import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

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
  const { slug } = await params;

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("BlogPost")
    .select("id, slug, title, content_html, cover_image_url, published_at, author_name")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return notFound();

  const normalizeHref = (href: string) => {
    const s = (href || "").trim();
    if (!s) return s;
    if (s.startsWith("#")) return s; // allow in-page anchors
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return s; // already has a scheme
    if (/^\/\//.test(s)) return "https:" + s; // protocol-relative
    if (/^\//.test(s)) return s; // internal absolute path
    return "https://" + s;
  };

  const html = sanitizeHtml(post.content_html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "span", "code", "pre", "hr"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
      span: ["class", "style"],
      code: ["class"],
    },
    allowedSchemesByTag: { img: ["data", "http", "https"] },
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.href) attribs.href = normalizeHref(attribs.href);
        return { tagName, attribs };
      },
    },
  });

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
  <div className="prose prose-neutral max-w-none [overflow-wrap:anywhere] hyphens-auto overflow-x-hidden prose-a:text-blue-600 hover:prose-a:text-blue-700 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_img]:max-w-full [&_img]:h-auto [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
