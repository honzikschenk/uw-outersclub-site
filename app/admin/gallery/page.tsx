import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GalleryAdmin from "@/components/admin/GalleryAdmin";

type GalleryRow = {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
};

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");
  const { data: membership } = await supabase
    .from("Membership")
    .select("admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.admin) return redirect("/member");

  const { data: images } = await supabase
    .from("GalleryImage")
    .select("id, title, image_url, created_at, group_id, sequence")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gallery Management</h1>
        <p className="text-sm text-muted-foreground">Upload and manage gallery images.</p>
      </div>
      <GalleryAdmin initialImages={images || []} />
    </div>
  );
}
