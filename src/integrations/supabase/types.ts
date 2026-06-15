export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_process_approvals: {
        Row: {
          approver_label: string | null
          approver_user_id: string | null
          business_process_id: string
          comments: string | null
          created_at: string
          decided_at: string | null
          decision: Database["public"]["Enums"]["approval_decision"]
          id: string
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          approver_label?: string | null
          approver_user_id?: string | null
          business_process_id: string
          comments?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          step_name: string
          step_order: number
          updated_at?: string
        }
        Update: {
          approver_label?: string | null
          approver_user_id?: string | null
          business_process_id?: string
          comments?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_process_approvals_business_process_id_fkey"
            columns: ["business_process_id"]
            isOneToOne: false
            referencedRelation: "business_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      business_processes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          comments: string | null
          completed_at: string | null
          created_at: string
          effective_date: string
          employee_id: string | null
          id: string
          initiated_at: string
          initiated_by: string | null
          payload_after: Json | null
          payload_before: Json | null
          process_type: Database["public"]["Enums"]["business_process_type"]
          reason: string | null
          status: Database["public"]["Enums"]["business_process_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          effective_date: string
          employee_id?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          payload_after?: Json | null
          payload_before?: Json | null
          process_type: Database["public"]["Enums"]["business_process_type"]
          reason?: string | null
          status?: Database["public"]["Enums"]["business_process_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          effective_date?: string
          employee_id?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          payload_after?: Json | null
          payload_before?: Json | null
          process_type?: Database["public"]["Enums"]["business_process_type"]
          reason?: string | null
          status?: Database["public"]["Enums"]["business_process_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_processes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      compensation_history: {
        Row: {
          business_process_id: string | null
          created_at: string
          currency: string
          effective_date: string
          employee_id: string
          end_date: string | null
          id: string
          pay_change_reason: string | null
          salary: number
          salary_usd: number
        }
        Insert: {
          business_process_id?: string | null
          created_at?: string
          currency: string
          effective_date: string
          employee_id: string
          end_date?: string | null
          id?: string
          pay_change_reason?: string | null
          salary: number
          salary_usd: number
        }
        Update: {
          business_process_id?: string | null
          created_at?: string
          currency?: string
          effective_date?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          pay_change_reason?: string | null
          salary?: number
          salary_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "compensation_history_business_process_id_fkey"
            columns: ["business_process_id"]
            isOneToOne: false
            referencedRelation: "business_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          cost_center: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cost_center: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cost_center?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          band_status: Database["public"]["Enums"]["band_status"]
          created_at: string
          currency: string
          department_id: string
          first_name: string
          hire_date: string
          id: string
          job_profile_id: string
          last_name: string
          level_id: string
          location_id: string
          manager_id: string | null
          salary: number
          salary_usd: number
          status: Database["public"]["Enums"]["employee_status"]
          supervisory_org: string | null
          updated_at: string
        }
        Insert: {
          band_status?: Database["public"]["Enums"]["band_status"]
          created_at?: string
          currency: string
          department_id: string
          first_name: string
          hire_date: string
          id: string
          job_profile_id: string
          last_name: string
          level_id: string
          location_id: string
          manager_id?: string | null
          salary: number
          salary_usd: number
          status?: Database["public"]["Enums"]["employee_status"]
          supervisory_org?: string | null
          updated_at?: string
        }
        Update: {
          band_status?: Database["public"]["Enums"]["band_status"]
          created_at?: string
          currency?: string
          department_id?: string
          first_name?: string
          hire_date?: string
          id?: string
          job_profile_id?: string
          last_name?: string
          level_id?: string
          location_id?: string
          manager_id?: string | null
          salary?: number
          salary_usd?: number
          status?: Database["public"]["Enums"]["employee_status"]
          supervisory_org?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_history: {
        Row: {
          business_process_id: string | null
          change_reason: string | null
          created_at: string
          department_id: string | null
          effective_date: string
          employee_id: string
          end_date: string | null
          id: string
          job_profile_id: string | null
          level_id: string | null
          location_id: string | null
          manager_id: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
        }
        Insert: {
          business_process_id?: string | null
          change_reason?: string | null
          created_at?: string
          department_id?: string | null
          effective_date: string
          employee_id: string
          end_date?: string | null
          id?: string
          job_profile_id?: string | null
          level_id?: string | null
          location_id?: string | null
          manager_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
        }
        Update: {
          business_process_id?: string | null
          change_reason?: string | null
          created_at?: string
          department_id?: string | null
          effective_date?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          job_profile_id?: string | null
          level_id?: string | null
          location_id?: string | null
          manager_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_history_business_process_id_fkey"
            columns: ["business_process_id"]
            isOneToOne: false
            referencedRelation: "business_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profiles: {
        Row: {
          created_at: string
          department_id: string
          id: string
          job_family: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          job_family: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          job_family?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          band_high: number
          band_low: number
          band_mid: number
          code: string
          created_at: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          band_high: number
          band_low: number
          band_mid: number
          code: string
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          band_high?: number
          band_low?: number
          band_mid?: number
          code?: string
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          country: string
          created_at: string
          currency: string
          id: string
          loc_mult: number
          name: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          currency: string
          id?: string
          loc_mult?: number
          name: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          currency?: string
          id?: string
          loc_mult?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "planner" | "viewer"
      approval_decision: "Pending" | "Approved" | "Denied" | "Skipped"
      band_status: "Below Band" | "Within Band" | "Above Band"
      business_process_status:
        | "Draft"
        | "In Progress"
        | "Pending Approval"
        | "Approved"
        | "Completed"
        | "Denied"
        | "Cancelled"
        | "Rescinded"
      business_process_type:
        | "Hire"
        | "Termination"
        | "Compensation Change"
        | "Promotion"
        | "Job Change"
        | "Location Change"
        | "Manager Change"
        | "Leave of Absence"
        | "Return from Leave"
        | "Contract Conversion"
      employee_status:
        | "Active"
        | "On Leave"
        | "Termination Pending"
        | "Contractor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "planner", "viewer"],
      approval_decision: ["Pending", "Approved", "Denied", "Skipped"],
      band_status: ["Below Band", "Within Band", "Above Band"],
      business_process_status: [
        "Draft",
        "In Progress",
        "Pending Approval",
        "Approved",
        "Completed",
        "Denied",
        "Cancelled",
        "Rescinded",
      ],
      business_process_type: [
        "Hire",
        "Termination",
        "Compensation Change",
        "Promotion",
        "Job Change",
        "Location Change",
        "Manager Change",
        "Leave of Absence",
        "Return from Leave",
        "Contract Conversion",
      ],
      employee_status: [
        "Active",
        "On Leave",
        "Termination Pending",
        "Contractor",
      ],
    },
  },
} as const
