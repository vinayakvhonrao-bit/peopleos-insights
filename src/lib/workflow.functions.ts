import { createServerFn } from "@tanstack/react-start";

// Simple FX -> USD multipliers (same values used by mock data generator).
const FX: Record<string, number> = { USD: 1, CAD: 0.74, GBP: 1.27, INR: 0.012 };

interface SubmitInput {
  employeeId: string;
  proposedLevelCode: string;
  proposedLocationName: string;
  proposedSalary: number; // in employee's local currency
  effectiveDate: string;  // YYYY-MM-DD
  reason?: string;
}

interface ApproveInput {
  businessProcessId: string;
  approverLabel: string;
  comments?: string;
}

interface SeedStepsInput {
  businessProcessId: string;
  steps: { stepOrder: number; stepName: string; approverLabel: string }[];
}

export const submitJobChange = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Snapshot current employee values
    const { data: emp, error: empErr } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, last_name, salary, salary_usd, currency, level_id, location_id, job_profile_id, department_id, manager_id, status, levels(code), locations(name)")
      .eq("id", data.employeeId)
      .single();
    if (empErr || !emp) throw new Error(empErr?.message ?? "Employee not found");

    const payloadBefore = {
      level: (emp.levels as { code: string } | null)?.code,
      location: (emp.locations as { name: string } | null)?.name,
      salary: Number(emp.salary),
      salary_usd: Number(emp.salary_usd),
      currency: emp.currency,
    };
    const payloadAfter = {
      level: data.proposedLevelCode,
      location: data.proposedLocationName,
      salary: data.proposedSalary,
      currency: emp.currency,
    };

    // 2. Insert business process
    const { data: bp, error: bpErr } = await supabaseAdmin
      .from("business_processes")
      .insert({
        process_type: "Job Change",
        status: "Pending Approval",
        employee_id: data.employeeId,
        effective_date: data.effectiveDate,
        reason: data.reason ?? "Promotion + comp adjustment",
        payload_before: payloadBefore,
        payload_after: payloadAfter,
      })
      .select("id")
      .single();
    if (bpErr || !bp) throw new Error(bpErr?.message ?? "Failed to create BP");

    return { businessProcessId: bp.id };
  });

export const seedApprovalSteps = createServerFn({ method: "POST" })
  .inputValidator((data: SeedStepsInput) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = data.steps.map((s) => ({
      business_process_id: data.businessProcessId,
      step_order: s.stepOrder,
      step_name: s.stepName,
      approver_label: s.approverLabel,
      decision: "Pending" as const,
    }));
    const { error } = await supabaseAdmin.from("business_process_approvals").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveNextStep = createServerFn({ method: "POST" })
  .inputValidator((data: ApproveInput) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find the next pending step in order
    const { data: pending, error: pendErr } = await supabaseAdmin
      .from("business_process_approvals")
      .select("id, step_order, step_name")
      .eq("business_process_id", data.businessProcessId)
      .eq("decision", "Pending")
      .order("step_order", { ascending: true })
      .limit(1);
    if (pendErr) throw new Error(pendErr.message);
    if (!pending || pending.length === 0) throw new Error("No pending steps remain");

    const step = pending[0];
    const { error: updErr } = await supabaseAdmin
      .from("business_process_approvals")
      .update({
        decision: "Approved",
        decided_at: new Date().toISOString(),
        approver_label: data.approverLabel,
        comments: data.comments ?? null,
      })
      .eq("id", step.id);
    if (updErr) throw new Error(updErr.message);

    // Are there more pending steps?
    const { count } = await supabaseAdmin
      .from("business_process_approvals")
      .select("id", { count: "exact", head: true })
      .eq("business_process_id", data.businessProcessId)
      .eq("decision", "Pending");

    if ((count ?? 0) > 0) {
      // Still pending — make sure header is "Pending Approval"
      await supabaseAdmin
        .from("business_processes")
        .update({ status: "Pending Approval" })
        .eq("id", data.businessProcessId);
      return { completed: false, remaining: count ?? 0 };
    }

    // ===== All steps approved -> COMPLETE the BP =====
    const { data: bp, error: bpErr } = await supabaseAdmin
      .from("business_processes")
      .select("id, employee_id, effective_date, payload_after, payload_before")
      .eq("id", data.businessProcessId)
      .single();
    if (bpErr || !bp || !bp.employee_id) throw new Error(bpErr?.message ?? "BP not found");

    const after = bp.payload_after as { level: string; location: string; salary: number; currency: string };
    const before = bp.payload_before as { level: string; location: string; salary: number; salary_usd: number; currency: string };

    // Look up new level + location IDs
    const [{ data: level }, { data: loc }] = await Promise.all([
      supabaseAdmin.from("levels").select("id").eq("code", after.level).single(),
      supabaseAdmin.from("locations").select("id, loc_mult").eq("name", after.location).single(),
    ]);
    if (!level || !loc) throw new Error("Could not resolve new level/location");

    const fx = FX[after.currency] ?? 1;
    const newSalaryUSD = Math.round(after.salary * fx);

    // Close prior open history rows for this employee
    await supabaseAdmin
      .from("compensation_history")
      .update({ end_date: bp.effective_date })
      .eq("employee_id", bp.employee_id)
      .is("end_date", null);
    await supabaseAdmin
      .from("job_history")
      .update({ end_date: bp.effective_date })
      .eq("employee_id", bp.employee_id)
      .is("end_date", null);

    // Insert new effective-dated comp + job rows
    const reason = after.level !== before.level ? "Promotion" : "Compensation Change";
    await supabaseAdmin.from("compensation_history").insert({
      employee_id: bp.employee_id,
      business_process_id: bp.id,
      effective_date: bp.effective_date,
      salary: after.salary,
      salary_usd: newSalaryUSD,
      currency: after.currency,
      pay_change_reason: reason,
    });
    await supabaseAdmin.from("job_history").insert({
      employee_id: bp.employee_id,
      business_process_id: bp.id,
      effective_date: bp.effective_date,
      level_id: level.id,
      location_id: loc.id,
      change_reason: reason,
    });

    // Update live employee snapshot
    await supabaseAdmin
      .from("employees")
      .update({
        level_id: level.id,
        location_id: loc.id,
        salary: after.salary,
        salary_usd: newSalaryUSD,
        currency: after.currency,
      })
      .eq("id", bp.employee_id);

    // Stamp BP completed
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("business_processes")
      .update({
        status: "Completed",
        approved_at: nowIso,
        completed_at: nowIso,
      })
      .eq("id", bp.id);

    return { completed: true, remaining: 0 };
  });

export const listBusinessProcesses = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("business_processes")
      .select(`
        id, process_type, status, effective_date, reason,
        initiated_at, approved_at, completed_at,
        payload_before, payload_after,
        employees ( id, first_name, last_name ),
        business_process_approvals ( id, step_order, step_name, approver_label, decision, decided_at )
      `)
      .order("initiated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCandidateEmployee = createServerFn({ method: "GET" })
  .inputValidator((data: { excludeIds: string[] }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Pick an Active employee at IC4 in SF that hasn't been used yet
    let q = supabaseAdmin
      .from("employees")
      .select(`
        id, first_name, last_name, salary, salary_usd, currency, status,
        levels!inner ( code ),
        locations!inner ( name ),
        departments ( name ),
        job_profiles ( name ),
        manager:manager_id ( id, first_name, last_name )
      `)
      .eq("status", "Active")
      .eq("levels.code", "IC4")
      .eq("locations.name", "SF")
      .limit(20);
    if (data.excludeIds.length > 0) {
      q = q.not("id", "in", `(${data.excludeIds.map((s) => `"${s}"`).join(",")})`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return null;
    const pick = rows[Math.floor(Math.random() * rows.length)];
    return pick;
  });
