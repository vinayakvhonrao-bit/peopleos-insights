
-- ============================================================
-- Workday-style dimensional + transactional extensions
-- Adds: supervisory_orgs, positions, position_assignments,
--       business_process_events (audit log)
-- ============================================================

-- 1) SUPERVISORY ORG (hierarchical dimension)
CREATE TABLE public.supervisory_orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_org_id uuid REFERENCES public.supervisory_orgs(id) ON DELETE SET NULL,
  manager_employee_id text REFERENCES public.employees(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisory_orgs TO authenticated;
GRANT ALL ON public.supervisory_orgs TO service_role;
ALTER TABLE public.supervisory_orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read supervisory_orgs"
  ON public.supervisory_orgs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage supervisory_orgs"
  ON public.supervisory_orgs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_sup_orgs_updated BEFORE UPDATE ON public.supervisory_orgs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) POSITION (a slot, independent of the worker)
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code text NOT NULL UNIQUE,
  job_profile_id uuid REFERENCES public.job_profiles(id) ON DELETE RESTRICT,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  supervisory_org_id uuid REFERENCES public.supervisory_orgs(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_filled boolean NOT NULL DEFAULT false,
  is_open_to_hire boolean NOT NULL DEFAULT false,
  opened_date date,
  closed_date date,
  fte numeric(4,2) NOT NULL DEFAULT 1.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read positions"
  ON public.positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage positions"
  ON public.positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_positions_updated BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) POSITION ASSIGNMENT HISTORY (effective-dated worker↔position)
CREATE TABLE public.position_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  business_process_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL,
  effective_date date NOT NULL,
  end_date date,
  assignment_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pos_assign_employee ON public.position_assignments(employee_id, effective_date);
CREATE INDEX idx_pos_assign_position ON public.position_assignments(position_id, effective_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.position_assignments TO authenticated;
GRANT ALL ON public.position_assignments TO service_role;
ALTER TABLE public.position_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read position_assignments"
  ON public.position_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage position_assignments"
  ON public.position_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4) Link worker + history to position + supervisory org
ALTER TABLE public.employees
  ADD COLUMN position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  ADD COLUMN supervisory_org_id uuid REFERENCES public.supervisory_orgs(id) ON DELETE SET NULL;

ALTER TABLE public.job_history
  ADD COLUMN position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  ADD COLUMN supervisory_org_id uuid REFERENCES public.supervisory_orgs(id) ON DELETE SET NULL;

-- 5) BUSINESS PROCESS EVENTS (generic immutable audit log)
CREATE TABLE public.business_process_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_process_id uuid NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
  event_type text NOT NULL,                  -- Initiated|Routed|Approved|Denied|Completed|Rescinded|CommentAdded|Edited
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  from_status text,
  to_status text,
  payload jsonb,                             -- diff / metadata
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bp_events_bp ON public.business_process_events(business_process_id, occurred_at);
GRANT SELECT, INSERT ON public.business_process_events TO authenticated;
GRANT ALL ON public.business_process_events TO service_role;
ALTER TABLE public.business_process_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read bp_events"
  ON public.business_process_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert bp_events"
  ON public.business_process_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
