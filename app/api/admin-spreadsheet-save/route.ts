import { supabaseService } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tableName, originalRows, editedRows, deletedRowIds } = await req.json();
    const supabase = supabaseService;
    let errors: string[] = [];

    // 1. Update changed rows
    for (const edited of editedRows) {
      const original = originalRows.find((row: any) => row.id === edited.id);
      if (!original) continue;
      // Only update if something changed
      const changedFields: Record<string, any> = {};
      for (const key of Object.keys(edited)) {
        if (key === "id") continue;
        if (edited[key] !== original[key]) {
          changedFields[key] = edited[key];
        }
      }
      if (Object.keys(changedFields).length > 0) {
        const { error } = await supabase.from(tableName).update(changedFields).eq("id", edited.id);
        if (error) errors.push(`Update failed for id ${edited.id}: ${error.message}`);
      }
    }

    // 2. Delete marked rows
    for (const id of deletedRowIds) {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) errors.push(`Delete failed for id ${id}: ${error.message}`);
    }

    if (errors.length === 0) {
      return NextResponse.json({ success: true, errors }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
