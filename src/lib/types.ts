export type Role = 'super_admin' | 'company_admin' | 'team_leader' | 'employee'

export interface Profile {
  id: string
  company_id: string | null
  team_id: string | null
  department_id: string | null
  full_name: string
  email: string
  role: Role
  avatar_url: string | null
  job_title: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise'
  created_at: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'

export interface Attendance {
  id: string
  company_id: string
  user_id: string
  work_date: string
  check_in_at: string | null
  check_out_at: string | null
  device_info: string | null
  ip_address: string | null
  total_hours: number | null
  status: AttendanceStatus
  work_summary: string | null
  challenges_faced: string | null
  tomorrow_plan: string | null
  created_at: string
}

export type WorkItemStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface DailyWorkItem {
  id: string
  attendance_id: string
  user_id: string
  task_name: string
  description: string | null
  hours_spent: number
  completion_percentage: number
  status: WorkItemStatus
  created_at: string
}

export type Priority = 'high' | 'medium' | 'low'
export type ReviewStatus = 'achieved' | 'partially_achieved' | 'not_achieved'

export interface WeeklyGoal {
  id: string
  company_id: string
  user_id: string
  week_start: string
  goal_name: string
  description: string | null
  priority: Priority
  estimated_hours: number | null
  target_date: string | null
  expected_outcome: string | null
  review_status: ReviewStatus | null
  review_explanation: string | null
  lessons_learned: string | null
  improvement_plan: string | null
  created_at: string
}

export type TaskStatus = 'not_started' | 'in_progress' | 'under_review' | 'completed'

export interface Task {
  id: string
  company_id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string | null
  priority: Priority
  status: TaskStatus
  due_date: string | null
  parent_task_id: string | null
  created_at: string
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export type LeaveType = 'casual' | 'sick' | 'emergency' | 'paid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  company_id: string
  user_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  created_at: string
}

export interface Notification {
  id: string
  company_id: string
  user_id: string
  title: string
  body: string | null
  type: string
  is_read: boolean
  created_at: string
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  company_id: string
  name: string
  description: string | null
  client_name: string | null
  status: ProjectStatus
  priority: Priority
  budget: number | null
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
}

export interface PerformanceScore {
  user_id: string
  full_name: string
  attendance_score: number
  task_score: number
  goals_score: number
  overall_score: number
}
