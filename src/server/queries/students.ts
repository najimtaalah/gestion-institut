import { prisma } from "@/lib/prisma";
import type { StudentStatus } from "@prisma/client";

export type StudentFilters = {
  establishmentId?: string;
  levelId?: string;
  classId?: string;
  status?: StudentStatus;
  search?: string;
};

export async function getStudents(filters: StudentFilters = {}, page = 1, pageSize = 30) {
  const where = {
    ...(filters.establishmentId && { establishmentId: filters.establishmentId }),
    ...(filters.levelId && { levelId: filters.levelId }),
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" as const } },
        { lastName: { contains: filters.search, mode: "insensitive" as const } },
        { email: { contains: filters.search, mode: "insensitive" as const } },
        { studentCode: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        establishment: { select: { id: true, name: true, code: true } },
        level: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total, pages: Math.ceil(total / pageSize) };
}

export async function getStudentById(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      establishment: true,
      level: true,
      class: true,
      group: true,
      field: true,
      financingPlans: {
        include: {
          installments: {
            include: { payments: true, reminders: { include: { author: { select: { id: true, name: true } } } } },
            orderBy: { dueDate: "asc" },
          },
        },
      },
    },
  });
}

export async function getStudentGrades(studentId: string, period?: string) {
  return prisma.grade.findMany({
    where: {
      studentId,
      ...(period && { evaluation: { period } }),
    },
    include: {
      evaluation: {
        include: { subject: true },
      },
    },
    orderBy: { evaluation: { date: "desc" } },
  });
}

export async function getStudentAttendances(studentId: string) {
  return prisma.attendance.findMany({
    where: { studentId },
    include: {
      session: {
        include: {
          course: { include: { subject: true, class: true } },
        },
      },
    },
    orderBy: { session: { date: "desc" } },
    take: 50,
  });
}

export async function getNextStudentCode(year: number): Promise<string> {
  const prefix = `STU-${year}-`;
  const last = await prisma.student.findFirst({
    where: { studentCode: { startsWith: prefix } },
    orderBy: { studentCode: "desc" },
  });
  const seq = last
    ? parseInt(last.studentCode.replace(prefix, ""), 10) + 1
    : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}
