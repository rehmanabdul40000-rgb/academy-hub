import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { NewStudentInput } from "@/types/student";

const workspaceIdSchema = z.string().uuid();

const studentRowSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(240),
  gender: z.enum(["Male", "Female", "Unspecified"]).default("Unspecified"),
  phone: z.string().trim().max(80).optional(),
  course: z.string().trim().max(240).optional(),
  dateJoined: z.string().trim().max(40).optional(),
  shift: z.enum(["Morning", "Evening", "Unspecified"]).default("Unspecified"),
  shiftTime: z.string().trim().max(80).optional(),
  totalFees: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  notes: z.string().trim().max(4000).optional(),
});

const pageSchema = z.object({
  workspaceId: workspaceIdSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(200).default(""),
  gender: z.enum(["Male", "Female", "Unspecified"]).optional(),
  shift: z.enum(["Morning", "Evening", "Unspecified"]).optional(),
});

const bulkSchema = z.object({
  workspaceId: workspaceIdSchema,
  rows: z.array(studentRowSchema).min(1).max(1000),
});

export const getScalableDatabaseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const configured = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
  if (!configured) return { configured: false, reachable: false, studentCount: null as number | null };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("academy_students")
      .select("id", { count: "exact", head: true });

    return {
      configured: true,
      reachable: !error,
      studentCount: typeof count === "number" ? count : null,
      error: error?.message ?? null,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      studentCount: null as number | null,
      error: error instanceof Error ? error.message : "Unable to reach database.",
    };
  }
});

export const listScalableStudentsPage = createServerFn({ method: "POST" })
  .validator((input: unknown) => pageSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let query = supabaseAdmin
      .from("academy_students")
      .select(
        "id, student_id, full_name, gender, phone, course, date_joined, shift, shift_time, total_fees, amount_paid, remaining_fees, payment_status, notes, created_at, updated_at",
        { count: "exact" },
      )
      .eq("workspace_id", data.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (data.gender) query = query.eq("gender", data.gender);
    if (data.shift) query = query.eq("shift", data.shift);
    if (data.search) {
      const safe = data.search.replace(/[\\:*&|!()']/g, " ").trim();
      if (safe) query = query.textSearch("search_document", safe, { type: "websearch", config: "simple" });
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const bulkImportStudentsToDatabase = createServerFn({ method: "POST" })
  .validator((input: unknown) => bulkSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows: NewStudentInput[] = data.rows;

    const payload = rows.map((row) => ({
      workspace_id: data.workspaceId,
      student_id: row.id.trim(),
      full_name: row.name.trim(),
      gender: row.gender ?? "Unspecified",
      phone: row.phone?.trim() || null,
      course: row.course?.trim() || null,
      date_joined: row.dateJoined?.trim() || null,
      shift: row.shift ?? "Unspecified",
      shift_time: row.shiftTime?.trim() || null,
      total_fees: Number(row.totalFees) || 0,
      amount_paid: Math.max(0, Number(row.amountPaid) || 0),
      notes: row.notes?.trim() || null,
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from("academy_students")
      .upsert(payload, { onConflict: "workspace_id,student_id", ignoreDuplicates: false })
      .select("id, student_id");

    if (error) throw new Error(error.message);

    return {
      imported: inserted?.length ?? 0,
      batchSize: payload.length,
    };
  });
