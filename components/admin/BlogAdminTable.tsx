"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import TurndownService from "turndown";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published: boolean;
  published_at: string | null;
  updated_at: string | null;
};

export default function BlogAdminTable({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    cover_image_url: "",
    published: false,
  });
  const [contentMd, setContentMd] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [errors, setErrors] = useState({ title: false, excerpt: false, content: false });
  const titleRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const didPositionCaretRef = useRef(false);
  const autosize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(1200, Math.max(256, el.scrollHeight)) + "px";
  };
  const focusContentEndOnce = () => {
    const el = contentRef.current;
    if (!el) return;
    try {
      const len = el.value?.length ?? 0;
      el.focus();
      el.selectionStart = len;
      el.selectionEnd = len;
    } catch {}
    didPositionCaretRef.current = true;
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  const defaultSlug = slugify(form.title || "");

  const openNew = () => {
    setEditing(null);
  setForm({ title: "", slug: "", excerpt: "", content_html: "", cover_image_url: "", published: false });
  setContentMd("");
  setSlugTouched(false);
  setErrors({ title: false, excerpt: false, content: false });
  setMode("edit");
  didPositionCaretRef.current = false;
    setIsOpen(true);
  };

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/admin/blog?id=${id}`);
    if (!res.ok) return alert("Failed to load post");
    const p = await res.json();
    setEditing(p);
    setForm({
      title: p.title || "",
      slug: p.slug || "",
      excerpt: p.excerpt || "",
      content_html: p.content_html || "",
      cover_image_url: p.cover_image_url || "",
      published: !!p.published,
    });
    try {
      const td = new TurndownService({ headingStyle: "atx" });
      const md = p.content_html ? td.turndown(p.content_html) : "";
      setContentMd(md);
    } catch {
      setContentMd("");
    }
    setSlugTouched(true);
    setErrors({ title: false, excerpt: false, content: false });
    setMode("edit");
    didPositionCaretRef.current = false;
    setIsOpen(true);
  };

  // Auto-resize textarea and place caret at end when opening editor with prefilled content
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    autosize(el);
    // caret positioning only once per open
    if (!didPositionCaretRef.current && isOpen && mode === "edit") {
      focusContentEndOnce();
    }
  }, [contentMd, isOpen, mode]);

  // When dialog opens for edit/new, focus editor and place caret at end
  useEffect(() => {
    if (!isOpen || mode !== "edit") return;
    didPositionCaretRef.current = false;
    // Wait for dialog to mount
    const id = requestAnimationFrame(() => focusContentEndOnce());
    return () => cancelAnimationFrame(id);
  }, [isOpen, mode, editing?.id]);

  const save = async () => {
    const title = (form.title || "").trim();
    const excerpt = (form.excerpt || "").trim();
    const content = (contentMd || "").trim();
    const nextErrors = { title: !title, excerpt: !excerpt, content: !content };
    if (nextErrors.title || nextErrors.excerpt || nextErrors.content) {
      setErrors(nextErrors);
      const firstRef = nextErrors.title ? titleRef : nextErrors.excerpt ? excerptRef : contentRef;
      // Focus first invalid field for quick correction
      firstRef.current?.focus();
      return;
    }
    const method = editing ? "PUT" : "POST";
    const body: any = { ...form };
    body.title = title;
    body.excerpt = excerpt;
    // Convert Markdown to sanitized HTML for storage
    const rawHtml = (marked.parse(contentMd, { breaks: true }) as string) || "";
    body.content_html = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "span", "code", "pre", "hr"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "title"],
        a: ["href", "name", "target", "rel"],
        span: ["class", "style"],
        code: ["class"],
      },
      allowedSchemesByTag: { img: ["data", "http", "https"] },
    });
    body.slug = (form.slug && form.slug.trim()) ? form.slug.trim() : defaultSlug;
    if (editing) body.id = editing.id;
    const res = await fetch("/api/admin/blog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const ok = res.ok;
    if (!ok) {
      const msg = await res.text();
      return alert(msg || "Failed to save");
    }
    const updated = await res.json();
    setIsOpen(false);
    if (editing) {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    } else {
      setPosts((prev) => [updated, ...prev]);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Failed to delete");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const prevUrl = form.cover_image_url?.trim();
  const processed = await compressImageFile(f, { maxWidth: 1600, maxHeight: 1200, quality: 0.8 });
  const fileForUpload = processed || f;
  const fd = new FormData();
  fd.append("file", fileForUpload);
    fd.append("folder", "covers");
    const res = await fetch("/api/admin/blog/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Upload failed");
      return;
    }
    const { url } = await res.json();
    setForm((prev) => ({ ...prev, cover_image_url: url }));

    if (prevUrl && confirm("Delete the previous cover image from storage?")) {
      await fetch(`/api/admin/blog/upload?url=${encodeURIComponent(prevUrl)}`, { method: "DELETE" });
    }
  };

  const removeCoverImage = async () => {
    const url = form.cover_image_url?.trim();
    if (!url) {
      setForm((prev) => ({ ...prev, cover_image_url: "" }));
      return;
    }
    const ok = confirm("Remove and delete this cover image from storage?");
    if (!ok) return;
    await fetch(`/api/admin/blog/upload?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    setForm((prev) => ({ ...prev, cover_image_url: "" }));
  };

  const togglePublish = async (post: PostRow) => {
    const nextPublished = !post.published;
    const res = await fetch("/api/admin/blog/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, published: nextPublished }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Failed to update publish status");
      return;
    }
    const updated = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: updated.published, published_at: updated.published_at, updated_at: updated.updated_at } : p)));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posts</CardTitle>
        <Button onClick={openNew}>New Post</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-gray-500">/{p.slug}</div>
                </div>
                <Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Published" : "Draft"}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.excerpt}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(p.id)}>Edit</Button>
                <Button size="sm" onClick={() => togglePublish(p)}>{p.published ? "Unpublish" : "Publish"}</Button>
                <Button variant="destructive" size="sm" onClick={() => del(p.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm">Title <span className="text-red-600">*</span></label>
              <Input
                required
                aria-required
                ref={titleRef}
                className={errors.title ? "border-red-500 focus-visible:ring-red-500" : undefined}
                value={form.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  if (errors.title) setErrors((prev) => ({ ...prev, title: false }));
                  setForm((prev) => {
                    const nextAuto = slugify(newTitle || "");
                    const prevAuto = slugify(prev.title || "");
                    const shouldAutofill = !slugTouched || prev.slug.trim() === "" || prev.slug === prevAuto;
                    return { ...prev, title: newTitle, slug: shouldAutofill ? nextAuto : prev.slug };
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Post URL (Slug)</label>
              <Input
                placeholder={defaultSlug || "my-post-title"}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Excerpt <span className="text-red-600">*</span></label>
              <Input
                required
                aria-required
                ref={excerptRef}
                className={errors.excerpt ? "border-red-500 focus-visible:ring-red-500" : undefined}
                value={form.excerpt}
                onChange={(e) => {
                  if (errors.excerpt) setErrors((prev) => ({ ...prev, excerpt: false }));
                  setForm({ ...form, excerpt: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Cover Image URL</label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
              <div className="flex items-center gap-3">
                <label htmlFor="coverFile" className="text-sm">Upload image</label>
                <input id="coverFile" type="file" accept="image/*" onChange={onCoverFileChange} />
                {form.cover_image_url && (
                  <Button type="button" variant="outline" onClick={removeCoverImage}>Remove image</Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm" htmlFor="content_html">Content (Markdown) <span className="text-red-600">*</span></label>
                <div className="flex gap-2 text-xs">
                  <Button type="button" size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>Edit</Button>
                  <Button type="button" size="sm" variant={mode === "preview" ? "default" : "outline"} onClick={() => setMode("preview")}>Preview</Button>
                </div>
              </div>
        {mode === "edit" ? (
                <textarea
                  key={editing ? editing.id : "new"}
                  id="content_html"
                  ref={contentRef}
                  required
                  aria-required
                  spellCheck={false}
          className={`min-h-40 sm:min-h-64 border rounded-md p-3 font-mono text-sm leading-6 whitespace-pre-wrap ${errors.content ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={contentMd}
                  placeholder="Write your post in Markdown... (e.g., # Heading, * list item)"
                  onChange={(e) => {
                    if (errors.content) setErrors((prev) => ({ ...prev, content: false }));
                    const target = e.currentTarget;
                    const selStart = target.selectionStart ?? 0;
                    const selEnd = target.selectionEnd ?? 0;
                    const nextVal = target.value;
                    setContentMd(nextVal);
                    requestAnimationFrame(() => {
                      const el = contentRef.current;
                      if (!el) return;
                      autosize(el);
                      // Restore selection if focused
                      if (document.activeElement === el) {
                        try {
                          el.selectionStart = selStart;
                          el.selectionEnd = selEnd;
                        } catch {}
                      }
                    });
                  }}
                  onKeyDown={(e) => {
                    const el = contentRef.current;
                    if (!el) return;
                    const start = el.selectionStart ?? 0;
                    const end = el.selectionEnd ?? 0;
                    const value = contentMd;
                    // Tab / Shift+Tab for indenting
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                      const before = value.slice(0, lineStart);
                      const line = value.slice(lineStart, end);
                      if (e.shiftKey) {
                        const dedented = line.replace(/^ {1,2}/gm, "");
                        const next = before + dedented + value.slice(end);
                        setContentMd(next);
                        requestAnimationFrame(() => {
                          const delta = line.length - dedented.length;
                          const posStart = start - Math.min(2, start - lineStart);
                          const posEnd = end - delta;
                          if (contentRef.current) {
                            contentRef.current.selectionStart = Math.max(lineStart, posStart);
                            contentRef.current.selectionEnd = Math.max(lineStart, posEnd);
                          }
                        });
                      } else {
                        const indented = line.replace(/^/gm, "  ");
                        const next = before + indented + value.slice(end);
                        setContentMd(next);
                        requestAnimationFrame(() => {
                          const delta = indented.length - line.length;
                          if (contentRef.current) {
                            const pos = start + Math.min(2, delta);
                            contentRef.current.selectionStart = pos;
                            contentRef.current.selectionEnd = pos;
                          }
                        });
                      }
                      return;
                    }
                    // Continue lists on Enter
                    if (e.key === "Enter") {
                      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                      const currentLine = value.slice(lineStart, start);
                      const m = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)?$/);
                      if (m) {
                        e.preventDefault();
                        const indent = m[1] ?? "";
                        const marker = m[2] ?? "";
                        const after = (m[3] ?? "").trim();
                        const insert = after.length === 0 ? "\n" : `\n${indent}${marker} `;
                        const next = value.slice(0, start) + insert + value.slice(end);
                        setContentMd(next);
                        requestAnimationFrame(() => {
                          if (contentRef.current) {
                            const pos = start + insert.length;
                            contentRef.current.selectionStart = pos;
                            contentRef.current.selectionEnd = pos;
                          }
                        });
                      }
                    }
                    // Bold/Italic shortcuts
                    if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "i")) {
                      e.preventDefault();
                      const wrap = e.key === "b" ? "**" : "*";
                      const selected = value.slice(start, end) || "text";
                      const next = value.slice(0, start) + wrap + selected + wrap + value.slice(end);
                      setContentMd(next);
                      requestAnimationFrame(() => {
                        if (contentRef.current) {
                          const posStart = start + wrap.length;
                          const posEnd = posStart + selected.length;
                          contentRef.current.selectionStart = posStart;
                          contentRef.current.selectionEnd = posEnd;
                        }
                      });
                    }
                  }}
                />
              ) : (
                <div className="prose prose-sm max-w-none p-3 border rounded-md bg-white overflow-auto">
                  {form.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.cover_image_url} alt="cover" className="w-full rounded mb-4" />
                  )}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml((marked.parse(contentMd || "") as string) || "<p class=\"text-gray-500\">Nothing to preview</p>")
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">Tip: Use Markdown. Enter continues list items; Tab/Shift+Tab indent; Cmd/Ctrl+B/I bold/italic.</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Status</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={form.published ? "outline" : "default"}
                  aria-pressed={!form.published}
                  onClick={() => setForm({ ...form, published: false })}
                >
                  Draft
                </Button>
                <Button
                  type="button"
                  variant={form.published ? "default" : "outline"}
                  aria-pressed={form.published}
                  onClick={() => setForm({ ...form, published: true })}
                >
                  Publish
                </Button>
              </div>
              <p className="text-xs text-gray-500">Published posts are visible to everyone on the Blog page.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

async function compressImageFile(file: File, opts: { maxWidth: number; maxHeight: number; quality: number }) {
  try {
    const img = await loadImage(file);
    const ratio = Math.min(opts.maxWidth / img.width, opts.maxHeight / img.height, 1);
    const targetW = Math.max(1, Math.round(img.width * ratio));
    const targetH = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', opts.quality));
    if (!blob) return null;
    const base = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return null;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read error'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
