"use client";
import React, { useEffect, useMemo, useState } from "react";
import LoadMoreBar from "@/components/ui/load-more-bar";
import { Folder, FolderOpen, Plus } from "lucide-react";

export type GalleryRow = {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
  group_id?: string | null;
  sequence?: number | null;
};

export default function GalleryAdmin({ initialImages }: { initialImages: GalleryRow[] }) {
  const [images, setImages] = useState<GalleryRow[]>(initialImages);
  const PAGE_SIZE = 15;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
  };

  const upload = async () => {
    if (!files || files.length === 0) return alert("Select image files first.");
    if (!title.trim()) return alert("Title is required.");
    setBusy(true);
    try {
      const caption = title.trim() || null;
      const groupId =
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const created: GalleryRow[] = [];
      for (let idx = 0; idx < files.length; idx++) {
        const f = files[idx];
        const processed = await compressImageFile(f, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.75,
        });
        const fileForUpload = processed || f;

        const fd = new FormData();
        fd.append("file", fileForUpload);
        fd.append("folder", "gallery");
        const up = await fetch("/api/admin/gallery/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const t = await up.text();
          throw new Error(t || `Failed to upload file ${f.name}`);
        }
        const { url } = (await up.json()) as { url: string };

        const res = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: caption,
            image_url: url,
            group_id: groupId,
            sequence: idx,
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          // attempt cleanup of uploaded file
          await fetch(`/api/admin/gallery/upload?url=${encodeURIComponent(url)}`, {
            method: "DELETE",
          }).catch(() => {});
          throw new Error(t || `Failed to create record for file ${f.name}`);
        }
        const row: GalleryRow = await res.json();
        created.push(row);
      }

      // Prepend the created images as a block (in order)
      setImages((prev) => [...created.reverse(), ...prev]);
      setTitle("");
      setFiles([]);
      const input = document.getElementById("gallery-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (row: GalleryRow) => {
    if (!confirm("Delete this image?")) return;
    setBusy(true);
    try {
      // best-effort delete storage object first
      await fetch(`/api/admin/gallery/upload?url=${encodeURIComponent(row.image_url)}`, {
        method: "DELETE",
      }).catch(() => {});
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to delete");
      }
      setImages((prev) => prev.filter((i) => i.id !== row.id));
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const groups = useMemo(() => buildGroups(images), [images]);
  // All images are grouped; ungrouped UI removed

  const refreshImages = async () => {
    const res = await fetch("/api/admin/gallery");
    if (res.ok) {
      const data = await res.json();
      setImages(data);
    }
  };

  const updateCaption = async (groupKey: string, newCaption: string) => {
    const group = groups.find((g) => g.key === groupKey);
    if (!group) return;
    const realGroupId = group.group_id;
    const payload = {
      group_id: realGroupId,
      ids: group.items.map((i) => i.id),
      caption: newCaption,
    };
    const res = await fetch("/api/admin/gallery/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(t || "Failed to update caption");
    }
    setImages((prev) =>
      prev.map((i) => (i.group_id === realGroupId ? { ...i, title: newCaption } : i)),
    );
  };

  const reorderInGroup = async (groupKey: string, nextIds: string[]) => {
    const group = groups.find((g) => g.key === groupKey);
    if (!group) return;
    const realGroupId = group.group_id;
    const res = await fetch("/api/admin/gallery/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: realGroupId, ids: nextIds }),
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(t || "Failed to reorder");
    }
    // Optimistic UI
    const itemsById = new Map(group.items.map((i) => [i.id, i] as const));
    const reordered = nextIds.map((id, i) => ({ ...itemsById.get(id)!, sequence: i }));
    setImages((prev) => {
      const others = prev.filter((i) => i.group_id !== realGroupId);
      return [...others, ...reordered];
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 grid gap-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title (required)
          </label>
          <input
            id="title"
            name="title"
            className="border rounded px-3 py-2"
            placeholder="Sunset at Algonquin"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="gallery-file" className="text-sm font-medium">
            Images
          </label>
          <input
            id="gallery-file"
            name="file"
            type="file"
            accept="image/*"
            multiple
            required
            className="block"
            onChange={onFileChange}
          />
          <p className="text-xs text-gray-500">
            Select multiple images to group under the same caption. Images are auto-optimized.
          </p>
        </div>
        <button
          type="button"
          onClick={upload}
          disabled={busy || files.length === 0 || !title.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "Uploading..." : files.length > 1 ? `Upload ${files.length} images` : "Upload"}
        </button>
      </div>

      {/* Folder-style groups */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* New group tile */}
          <FolderTile
            title="New group"
            icon={<Plus className="h-5 w-5" />}
            highlight
            onClick={async () => {
              const newId =
                crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              setPendingGroupId(newId);
              setExpandedGroup(newId);
            }}
            onDropItem={async (payload: { id: string }) => {
              const newId =
                crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              setPendingGroupId(newId);
              await moveImage(payload.id, newId);
              await refreshImages();
              setExpandedGroup(newId);
            }}
          />
          {groups.slice(0, visible).map((g) => (
            <FolderTile
              key={g.key}
              title={g.caption || "Untitled"}
              count={g.items.length}
              thumbs={g.items.slice(0, 3).map((i) => i.image_url)}
              onClick={() => setExpandedGroup(expandedGroup === g.key ? null : g.key)}
              onDropItem={async (payload: { id: string }) => {
                await moveImage(payload.id, g.group_id);
                await refreshImages();
                setExpandedGroup(g.key);
              }}
            />
          ))}
        </div>
        <div className="pt-2">
          <LoadMoreBar
            hasMore={groups.length > visible}
            remaining={Math.max(0, groups.length - visible)}
            size={PAGE_SIZE}
            onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
          />
        </div>

        {/* Expanded detail: either a group or ungrouped */}
        {expandedGroup &&
          expandedGroup !== "UNGROUPED" &&
          (() => {
            const g = groups.find((x) => x.key === expandedGroup);
            if (!g) {
              if (expandedGroup === pendingGroupId) {
                return (
                  <EmptyGroupDropZone
                    onDropItem={async (payload: { id: string }) => {
                      if (!pendingGroupId) return;
                      await moveImage(payload.id, pendingGroupId);
                      await refreshImages();
                    }}
                  />
                );
              }
              return null;
            }
            return (
              <div className="border rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 p-4 border-b">
                  <div className="flex items-center gap-2 min-w-0 w-full">
                    <input
                      className="border rounded px-3 py-2 w-full min-w-0"
                      defaultValue={g.caption || ""}
                      placeholder="Trip caption"
                      onBlur={(e) => updateCaption(g.key, e.target.value)}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {g.items.length} photo{g.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <GroupReorderGrid group={g} onDelete={del} onReorder={reorderInGroup} />
              </div>
            );
          })()}
      </section>
    </div>
  );
}

async function compressImageFile(
  file: File,
  opts: { maxWidth: number; maxHeight: number; quality: number },
) {
  try {
    const img = await loadImage(file);
    const ratio = Math.min(opts.maxWidth / img.width, opts.maxHeight / img.height, 1);
    const targetW = Math.max(1, Math.round(img.width * ratio));
    const targetH = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", opts.quality),
    );
    if (!blob) return null;
    const base = (file.name || "image").replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return null;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

type Group = {
  key: string;
  group_id: string;
  caption: string | null;
  items: GalleryRow[];
};

function buildGroups(images: GalleryRow[]): Group[] {
  const map = new Map<string, GalleryRow[]>();
  for (const img of images) {
    const gid = (img as any).group_id as string | undefined;
    if (!gid) continue; // All new uploads have a group_id; older singles can be handled later
    const arr = map.get(gid) || [];
    arr.push(img as any);
    map.set(gid, arr);
  }
  const groups: Group[] = Array.from(map.entries()).map(([gid, arr]) => {
    const sorted = [...arr].sort((a, b) => ((a as any).sequence ?? 0) - ((b as any).sequence ?? 0));
    const caption = sorted.find((i) => i.title)?.title || null;
    return { key: gid, group_id: gid, caption, items: sorted };
  });
  // sort groups by most recent image
  groups.sort((a, b) => {
    const la = Math.max(...a.items.map((i) => new Date(i.created_at).getTime()));
    const lb = Math.max(...b.items.map((i) => new Date(i.created_at).getTime()));
    return lb - la;
  });
  return groups;
}

function GroupReorderGrid({
  group,
  onDelete,
  onReorder,
}: {
  group: Group;
  onDelete: (row: GalleryRow) => void;
  onReorder: (groupKey: string, ids: string[]) => void;
}) {
  const [ids, setIds] = useState(group.items.map((i) => i.id));
  useEffect(() => {
    setIds(group.items.map((i) => i.id));
  }, [group.items.map((i) => i.id).join(",")]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    // Provide JSON so folders can accept moves
    e.dataTransfer.setData("text/plain", JSON.stringify({ id }));
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    let draggedId = e.dataTransfer.getData("text/plain");
    try {
      const parsed = JSON.parse(draggedId);
      if (parsed && typeof parsed.id === "string") draggedId = parsed.id;
    } catch {}
    if (!draggedId || draggedId === targetId) return;
    const current = [...ids];
    const from = current.indexOf(draggedId);
    const to = current.indexOf(targetId);
    if (from < 0 || to < 0) return;
    current.splice(to, 0, ...current.splice(from, 1));
    setIds(current);
  };

  const saveOrder = () => onReorder(group.key, ids);

  const byId = new Map(group.items.map((i) => [i.id, i] as const));
  const visibleIds = ids.filter((id) => byId.has(id));

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleIds.map((id) => {
          const img = byId.get(id);
          if (!img) return null;
          return (
            <div
              key={id}
              className="border rounded overflow-hidden bg-white"
              draggable
              onDragStart={(e) => onDragStart(e, id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.title || ""}
                className="aspect-square w-full object-cover"
              />
              <div className="p-2 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-500">Drag to reorder</div>
                <button
                  type="button"
                  onClick={() => onDelete(img)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-right">
        <button
          type="button"
          onClick={saveOrder}
          className="bg-gray-900 text-white px-3 py-2 rounded"
        >
          Save order
        </button>
      </div>
    </div>
  );
}

function EmptyGroupDropZone({ onDropItem }: { onDropItem: (payload: { id: string }) => void }) {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === "string") onDropItem({ id: parsed.id });
    } catch {
      if (raw) onDropItem({ id: raw });
    }
  };
  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="p-4 border-b flex items-center gap-2 text-gray-700">
        <FolderOpen className="h-4 w-4" />
        <div className="text-sm font-medium">New group</div>
      </div>
      <div onDragOver={onDragOver} onDrop={onDrop} className="p-8">
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          Drag images here to create this group
        </div>
      </div>
    </div>
  );
}

function FolderTile({
  title,
  count,
  thumbs,
  icon,
  highlight,
  onClick,
  onDropItem,
}: {
  title: string;
  count?: number;
  thumbs?: string[];
  icon?: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
  onDropItem?: (payload: { id: string }) => void;
}) {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === "string") onDropItem?.({ id: parsed.id });
    } catch {
      if (raw) onDropItem?.({ id: raw });
    }
  };
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative cursor-pointer select-none rounded-lg border ${highlight ? "border-dashed border-blue-400 bg-blue-50" : "bg-white"} p-3 shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-center gap-2">
        {icon ?? <Folder className="h-5 w-5 text-gray-600" />}
        <div className="truncate text-sm font-medium">{title}</div>
        {typeof count === "number" && (
          <span className="ml-auto text-xs text-gray-500">{count}</span>
        )}
      </div>
      {thumbs && thumbs.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="thumb" className="h-10 w-full object-cover rounded" />
          ))}
        </div>
      )}
      <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-blue-300"></div>
    </div>
  );
}

async function moveImage(id: string, target_group_id: string | null) {
  const res = await fetch("/api/admin/gallery/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, target_group_id }),
  });
  if (!res.ok) {
    const t = await res.text();
    alert(t || "Failed to move image");
  }
}
