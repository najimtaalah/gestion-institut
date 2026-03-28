import { Badge } from "@/components/ui/badge";
import {
  installmentStatusLabel,
  sessionStatusLabel,
  studentStatusLabel,
  attendanceLabel,
  courseTypeLabel,
} from "@/lib/utils";

export function InstallmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "destructive" | "gray" | "info"> = {
    PAID: "success",
    PARTIAL: "warning",
    PENDING: "info",
    LATE: "warning",
    UNPAID: "destructive",
  };
  return <Badge variant={map[status] ?? "gray"}>{installmentStatusLabel(status)}</Badge>;
}

export function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "destructive" | "gray" | "info"> = {
    DONE: "success",
    PLANNED: "info",
    CANCELLED: "destructive",
    POSTPONED: "warning",
  };
  return <Badge variant={map[status] ?? "gray"}>{sessionStatusLabel(status)}</Badge>;
}

export function StudentStatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "destructive" | "gray" | "info" | "secondary"> = {
    ACTIVE: "success",
    SUSPENDED: "warning",
    GRADUATED: "secondary",
    WITHDRAWN: "destructive",
    ARCHIVED: "gray",
  };
  return <Badge variant={map[status] as any ?? "gray"}>{studentStatusLabel(status)}</Badge>;
}

export function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "destructive"> = {
    PRESENT: "success",
    LATE: "warning",
    ABSENT: "destructive",
  };
  return <Badge variant={map[status] ?? "gray" as any}>{attendanceLabel(status)}</Badge>;
}

export function CourseTypeBadge({ type }: { type: string }) {
  const map: Record<string, "info" | "purple" | "warning"> = {
    PRESENTIAL: "info",
    REMOTE: "purple",
    HYBRID: "warning",
  };
  return <Badge variant={map[type] ?? "gray" as any}>{courseTypeLabel(type)}</Badge>;
}
