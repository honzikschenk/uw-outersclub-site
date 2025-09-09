"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import sanitizeHtml from "sanitize-html";

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
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [errors, setErrors] = useState({ title: false, excerpt: false, content: false });
  const titleRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const didFocusEditorRef = useRef(false);
  const didSetInitialHtmlRef = useRef(false);
  const normalizeHref = (href: string) => {
    const s = (href || "").trim();
    if (!s) return s;
    if (s.startsWith("#")) return s; // in-page anchor
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return s; // has scheme (http, https, mailto, tel, etc.)
    if (/^\/\//.test(s)) return "https:" + s; // protocol-relative
    if (/^\//.test(s)) return s; // site-absolute path (internal link)
    return "https://" + s; // bare domain or relative-ish -> make absolute
  };
  const sanitizeCfg = {
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
      a: (tagName: string, attribs: Record<string, string>) => {
        const href = attribs.href;
        if (href) {
          attribs.href = normalizeHref(href);
        }
        return { tagName, attribs };
      },
    },
  } as const;
  const placeCaretAtEnd = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
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
  setSlugTouched(false);
  setErrors({ title: false, excerpt: false, content: false });
  setMode("edit");
  didFocusEditorRef.current = false;
  didSetInitialHtmlRef.current = false;
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
    setSlugTouched(true);
    setErrors({ title: false, excerpt: false, content: false });
    setMode("edit");
  didFocusEditorRef.current = false;
  didSetInitialHtmlRef.current = false;
    setIsOpen(true);
  };

  // Focus editor and place caret at end when opening
  useEffect(() => {
    if (!isOpen || mode !== "edit") return;
    const id = requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      // Set initial HTML only once per open/edit session
      if (!didSetInitialHtmlRef.current) {
        el.innerHTML = form.content_html || "<p><br/></p>";
        didSetInitialHtmlRef.current = true;
      }
      if (!didFocusEditorRef.current) {
        placeCaretAtEnd();
        didFocusEditorRef.current = true;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, mode, editing?.id]);

  // When switching back to edit mode, re-sync the editor contents once
  useEffect(() => {
    if (mode === "edit") {
      didSetInitialHtmlRef.current = false;
      didFocusEditorRef.current = false;
    }
  }, [mode]);

  // Track selection inside editor for toolbar actions
  useEffect(() => {
    const handler = () => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        lastRangeRef.current = range;
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    if (lastRangeRef.current) sel?.addRange(lastRangeRef.current);
  };

  const save = async () => {
    const title = (form.title || "").trim();
    const excerpt = (form.excerpt || "").trim();
    const content = (form.content_html || "").trim();
    const nextErrors = { title: !title, excerpt: !excerpt, content: !content };
    if (nextErrors.title || nextErrors.excerpt || nextErrors.content) {
      setErrors(nextErrors);
      const firstRef = nextErrors.title ? titleRef : nextErrors.excerpt ? excerptRef : editorRef;
      // Focus first invalid field for quick correction
      firstRef.current?.focus();
      return;
    }
    const method = editing ? "PUT" : "POST";
    const body: any = { ...form };
    body.title = title;
    body.excerpt = excerpt;
    // Sanitize HTML for storage
    body.content_html = sanitizeHtml(form.content_html || "", sanitizeCfg as any);
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
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("bold"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}><b>B</b></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("italic"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}><i>I</i></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("underline"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}><u>U</u></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("insertUnorderedList"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>• List</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("insertOrderedList"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>1. List</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("formatBlock", false, "h1"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>H1</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("formatBlock", false, "h2"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>H2</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("formatBlock", false, "h3"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>H3</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { restoreSelection(); document.execCommand("formatBlock", false, "p"); const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML})); }}>Paragraph</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  restoreSelection();
                  const input = prompt("Link URL:");
                  const url = input ? normalizeHref(input) : "";
                  if (url) {
                    document.execCommand("createLink", false, url);
                    // best-effort: add rel/target if desired in the future
                  }
                  const el = editorRef.current; if (el) setForm((p)=>({...p, content_html: el.innerHTML}));
                }}>Link</Button>
                <div className="ml-auto flex gap-2 text-xs">
                  <Button type="button" size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>Edit</Button>
                  <Button type="button" size="sm" variant={mode === "preview" ? "default" : "outline"} onClick={() => setMode("preview")}>Preview</Button>
                </div>
              </div>
              {mode === "edit" ? (
        <div
                  key={editing ? editing.id : "new"}
                  ref={editorRef}
                  className={`min-h-40 sm:min-h-64 border rounded-md p-3 bg-white focus:outline-none prose prose-sm max-w-none ${errors.content ? "ring-1 ring-red-500" : ""}`}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    if (errors.content) setErrors((prev) => ({ ...prev, content: false }));
          const html = (e.currentTarget as HTMLDivElement).innerHTML;
          setForm((prev) => ({ ...prev, content_html: html }));
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const html = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
                    const sanitized = sanitizeHtml(html, sanitizeCfg as any);
                    restoreSelection();
                    document.execCommand("insertHTML", false, sanitized);
                    // Update state
                    const el = editorRef.current;
                    if (el) setForm((prev) => ({ ...prev, content_html: el.innerHTML }));
                  }}
                />
              ) : (
                <div className="prose prose-sm max-w-none p-3 border rounded-md bg-white overflow-auto">
                  {form.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.cover_image_url} alt="cover" className="w-full rounded mb-4" />
                  )}
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content_html || "<p class=\"text-gray-500\">Nothing to preview</p>", sanitizeCfg as any) }} />
                </div>
              )}
              <p className="text-xs text-gray-500">Tip: Use the toolbar or keyboard shortcuts (Cmd/Ctrl+B/I/U).</p>
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
