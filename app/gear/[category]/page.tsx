import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ClientCategoryGrid from "@/components/gear/ClientCategoryGrid";
import Image from "next/image";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  const supabase = await createClient();
  const { data: items, error } = await supabase.from("Gear").select("*").eq("category", category);

  if (error) {
    return <div className="p-8 text-red-600">Error loading gear: {error.message}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/gear" className="hover:underline">
          Gear Categories
        </Link>
        <span>/</span>
        <span className="capitalize">{category}</span>
      </nav>
      <h1 className="text-4xl font-bold mb-8 capitalize">{category}</h1>
      {items && items.length > 0 ? (
        <ClientCategoryGrid items={items} category={category} />
      ) : (
        <div className="text-lg text-muted-foreground">No gear found in this category.</div>
      )}
    </div>
  );
}
