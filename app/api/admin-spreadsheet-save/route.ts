import { supabaseService } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tableName, originalRows, editedRows, deletedRowIds } = await req.json();
    const supabase = supabaseService;
    let errors: string[] = [];

    // 1. Update changed rows
    for (const edited of editedRows) {
      let original;
      if (tableName === 'Membership') {
        original = originalRows.find((row: any) => row.user_id === edited.user_id);
      } else {
        original = originalRows.find((row: any) => row.id === edited.id);
      }
      if (!original) continue;
      
      // Only update if something changed
      const changedFields: Record<string, any> = {};
      for (const key of Object.keys(edited)) {
        if (key === "id" || (tableName === 'Membership' && key === "user_id")) continue;
        if (edited[key] !== original[key]) {
          changedFields[key] = edited[key];
        }
      }
      
      if (Object.keys(changedFields).length > 0) {
        let updateQuery;
        if (tableName === 'Membership') {
          updateQuery = supabase.from(tableName).update(changedFields).eq("user_id", edited.user_id);
        } else {
          updateQuery = supabase.from(tableName).update(changedFields).eq("id", edited.id);
        }
        const { error } = await updateQuery;
        if (error) errors.push(`Update failed for ${tableName === 'Membership' ? 'user_id' : 'id'} ${edited.id || edited.user_id}: ${error.message}`);
      }
    }

    // 2. Delete marked rows
    for (const id of deletedRowIds) {
      let deleteQuery;
      if (tableName === 'Membership') {
        deleteQuery = supabase.from(tableName).delete().eq("user_id", id);
      } else {
        deleteQuery = supabase.from(tableName).delete().eq("id", id);
      }
      const { error } = await deleteQuery;
      if (error) errors.push(`Delete failed for ${tableName === 'Membership' ? 'user_id' : 'id'} ${id}: ${error.message}`);
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
