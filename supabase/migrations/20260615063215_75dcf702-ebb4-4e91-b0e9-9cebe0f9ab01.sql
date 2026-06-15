
-- ============ ENUMS ============
CREATE TYPE public.business_process_type AS ENUM (
  'Hire',
  'Termination',
  'Compensation Change',
  'Promotion',
  'Job Change',
  'Location Change',
  'Manager Change',
  'Leave of Absence',
  'Return from Leave',
  'Contract Conversion'
);

CREATE TYPE public.business_process_status AS ENUM (
  'Draft',
  'In Progress',
  'Pending Approval',
  'Approved',
  'Completed',
  'Denied',
  'Cancelled',
  'Rescinded'
);

CREATE TYPE public.approval_decision AS ENUM ('Pending', 'Approved', 'Denied', 'Skipped');

-- ============ BUSINESS PROCESSES (transaction header) ============
CREATE TABLE public.business_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_type business_process_type NOT NULL,
  status business_process_status NOT NULL DEFAULT 'Draft',
  employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  -- employee_id is nullable so a Hire can exist before the employee row does;
  -- once the Hire completes, the employee row is created and back-linked.
  effective_date DATE NOT NULL,
  reason TEXT,
  comments TEXT,

  -- before/after snapshots of the affected fields (jsonb so each process type is flexible)
  payload_before JSONB,
  payload_after  JSONB,

  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bp_employee_idx       ON public.business_processes(employee_id);
CREATE INDEX bp_type_idx           ON public.business_processes(process_type);
CREATE INDEX bp_status_idx         ON public.business_processes(status);
CREATE INDEX bp_effective_date_idx ON public.business_processes(effective_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_processes TO authenticated;
GRANT ALL ON public.business_processes TO service_role;
ALTER TABLE public.business_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp read auth" ON public.business_processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "bp admin write" ON public.business_processes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bp_updated_at BEFORE UPDATE ON public.business_processes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ APPROVALS (multi-step audit trail) ============
CREATE TABLE public.business_process_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_process_id UUID NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_name TEXT NOT NULL,                          -- e.g. "Manager Approval", "Comp Partner", "HRBP", "Finance"
  approver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_label TEXT,                              -- display name snapshot (in case the user is removed)
  decision approval_decision NOT NULL DEFAULT 'Pending',
  decided_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_process_id, step_order)
);
CREATE INDEX bpa_bp_idx ON public.business_process_approvals(business_process_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_process_approvals TO authenticated;
GRANT ALL ON public.business_process_approvals TO service_role;
ALTER TABLE public.business_process_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpa read auth" ON public.business_process_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "bpa admin write" ON public.business_process_approvals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bpa_updated_at BEFORE UPDATE ON public.business_process_approvals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ COMPENSATION HISTORY (effective-dated) ============
CREATE TABLE public.compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  business_process_id UUID REFERENCES public.business_processes(id) ON DELETE SET NULL,
  effective_date DATE NOT NULL,
  end_date DATE,                                    -- set when a later record supersedes this one; NULL = current
  salary NUMERIC(12,2) NOT NULL,
  salary_usd NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  pay_change_reason TEXT,                           -- "Annual Merit", "Promotion", "Market Adjustment", "Hire", etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comp_hist_emp_idx       ON public.compensation_history(employee_id);
CREATE INDEX comp_hist_effective_idx ON public.compensation_history(employee_id, effective_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compensation_history TO authenticated;
GRANT ALL ON public.compensation_history TO service_role;
ALTER TABLE public.compensation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comp_hist read auth" ON public.compensation_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "comp_hist admin write" ON public.compensation_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ JOB / ORG HISTORY (effective-dated) ============
CREATE TABLE public.job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  business_process_id UUID REFERENCES public.business_processes(id) ON DELETE SET NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  job_profile_id UUID REFERENCES public.job_profiles(id) ON DELETE SET NULL,
  department_id  UUID REFERENCES public.departments(id)  ON DELETE SET NULL,
  location_id    UUID REFERENCES public.locations(id)    ON DELETE SET NULL,
  level_id       UUID REFERENCES public.levels(id)       ON DELETE SET NULL,
  manager_id     TEXT REFERENCES public.employees(id)    ON DELETE SET NULL,
  status         employee_status,
  change_reason  TEXT,                              -- "Promotion", "Reorg", "Transfer", "Hire", "Termination", etc.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX job_hist_emp_idx       ON public.job_history(employee_id);
CREATE INDEX job_hist_effective_idx ON public.job_history(employee_id, effective_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_history TO authenticated;
GRANT ALL ON public.job_history TO service_role;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_hist read auth" ON public.job_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "job_hist admin write" ON public.job_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
