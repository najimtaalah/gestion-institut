import type {
  User,
  Establishment,
  Student,
  Level,
  Field,
  Class,
  Group,
  Subject,
  Room,
  Course,
  Session,
  Attendance,
  Evaluation,
  Grade,
  Bulletin,
  BulletinPeriod,
  BulletinSubjectLine,
  FinancingPlan,
  Installment,
  Payment,
  Reminder,
  CourseAssignment,
  UserRole,
  StudentStatus,
  CourseType,
  SessionStatus,
  AttendanceStatus,
  InstallmentStatus,
  BulletinStatus,
} from "@prisma/client";

export type {
  User,
  Establishment,
  Student,
  Level,
  Field,
  Class,
  Group,
  Subject,
  Room,
  Course,
  Session,
  Attendance,
  Evaluation,
  Grade,
  Bulletin,
  BulletinPeriod,
  BulletinSubjectLine,
  FinancingPlan,
  Installment,
  Payment,
  Reminder,
  CourseAssignment,
  UserRole,
  StudentStatus,
  CourseType,
  SessionStatus,
  AttendanceStatus,
  InstallmentStatus,
  BulletinStatus,
};

// ─── Types enrichis (avec relations) ───

export type StudentWithRelations = Student & {
  establishment: Establishment;
  level: Level | null;
  class: Class | null;
  group: Group | null;
  field: Field | null;
};

export type StudentFull = StudentWithRelations & {
  attendances: (Attendance & { session: Session & { course: Course & { subject: Subject } } })[];
  grades: (Grade & { evaluation: Evaluation & { subject: Subject } })[];
  bulletins: (Bulletin & { bulletinPeriod: BulletinPeriod; subjectLines: BulletinSubjectLine[] })[];
  financingPlans: (FinancingPlan & { installments: Installment[] })[];
};

export type SessionWithRelations = Session & {
  course: Course & {
    subject: Subject;
    class: Class;
    group: Group | null;
  };
  room: Room | null;
  teacher: User | null;
  attendances: (Attendance & { student: Student })[];
};

export type InstallmentWithRelations = Installment & {
  financingPlan: FinancingPlan & { student: Student };
  payments: Payment[];
  reminders: (Reminder & { author: User | null })[];
};

export type BulletinWithRelations = Bulletin & {
  student: Student;
  bulletinPeriod: BulletinPeriod;
  subjectLines: BulletinSubjectLine[];
};

// ─── Types pour les formulaires ───

export type CreateStudentInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  establishmentId: string;
  levelId?: string;
  classId?: string;
  groupId?: string;
  fieldId?: string;
  notes?: string;
};

export type CreateCourseInput = {
  title?: string;
  type: CourseType;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  visioLink?: string;
  notes?: string;
  establishmentId: string;
  classId: string;
  groupId?: string;
  subjectId: string;
  teacherIds: string[];
};

export type CreateInstallmentInput = {
  label: string;
  dueDate: string;
  amount: number;
  financingPlanId: string;
};

// ─── Type pour les stats dashboard ───

export type DashboardStats = {
  totalStudents: number;
  activeStudents: number;
  totalSessions: number;
  doneSessions: number;
  pendingInstallments: number;
  lateInstallments: number;
  totalRevenueDue: number;
  totalRevenuePaid: number;
};

// ─── Permissions ───

export type Permission =
  | "students:read"
  | "students:write"
  | "academic:read"
  | "academic:write"
  | "planning:read"
  | "planning:write"
  | "grades:read"
  | "grades:write"
  | "attendance:read"
  | "attendance:write"
  | "bulletins:read"
  | "bulletins:write"
  | "bulletins:validate"
  | "finance:read"
  | "finance:write"
  | "users:read"
  | "users:write"
  | "establishments:read"
  | "establishments:write"
  | "settings:read"
  | "settings:write";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "students:read", "students:write",
    "academic:read", "academic:write",
    "planning:read", "planning:write",
    "grades:read", "grades:write",
    "attendance:read", "attendance:write",
    "bulletins:read", "bulletins:write", "bulletins:validate",
    "finance:read", "finance:write",
    "users:read", "users:write",
    "establishments:read", "establishments:write",
    "settings:read", "settings:write",
  ],
  ESTABLISHMENT_ADMIN: [
    "students:read", "students:write",
    "academic:read", "academic:write",
    "planning:read", "planning:write",
    "grades:read", "grades:write",
    "attendance:read", "attendance:write",
    "bulletins:read", "bulletins:write", "bulletins:validate",
    "finance:read", "finance:write",
    "users:read", "users:write",
    "establishments:read",
    "settings:read", "settings:write",
  ],
  PEDAGOGICAL_MANAGER: [
    "students:read", "students:write",
    "academic:read", "academic:write",
    "planning:read", "planning:write",
    "grades:read", "grades:write",
    "attendance:read", "attendance:write",
    "bulletins:read", "bulletins:write", "bulletins:validate",
    "finance:read",
    "users:read",
    "establishments:read",
    "settings:read",
  ],
  LEVEL_MANAGER: [
    "students:read",
    "academic:read",
    "planning:read",
    "grades:read", "grades:write",
    "attendance:read", "attendance:write",
    "bulletins:read", "bulletins:write",
    "finance:read",
    "establishments:read",
  ],
  FINANCIAL_MANAGER: [
    "students:read",
    "finance:read", "finance:write",
    "establishments:read",
    "settings:read",
  ],
  TEACHER: [
    "students:read",
    "planning:read",
    "grades:read", "grades:write",
    "attendance:read", "attendance:write",
    "bulletins:read",
    "establishments:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
