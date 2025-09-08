import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BlogAdminTable from "../../../components/admin/BlogAdminTable";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");
  const { data: membership } = await supabase
    .from("Membership")
    .select("admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.admin) return redirect("/member");

  const { data: posts } = await supabase
    .from("BlogPost")
    .select("id, slug, title, excerpt, published, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <p className="text-sm text-muted-foreground">Create and manage blog posts.</p>
      </div>
      <BlogAdminTable initialPosts={posts || []} />
    </div>
  );
}
