import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types";

export async function getDashboardStats(
  establishmentIds?: string[]
): Promise<DashboardStats> {
  const estabFilter = establishmentIds?.length
    ? { establishmentId: { in: establishmentIds } }
    : {};

  const [
    totalStudents,
    activeStudents,
    totalSessions,
    doneSessions,
    installmentStats,
  ] = await Promise.all([
    prisma.student.count({ where: { ...estabFilter, status: { not: "ARCHIVED" } } }),
    prisma.student.count({ where: { ...estabFilter, status: "ACTIVE" } }),
    prisma.session.count({
      where: {
        course: estabFilter.establishmentId
          ? { establishmentId: { in: establishmentIds } }
          : {},
      },
    }),
    prisma.session.count({
      where: {
        status: "DONE",
        course: estabFilter.establishmentId
          ? { establishmentId: { in: establishmentIds } }
          : {},
      },
    }),
    prisma.installment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true, paidAmount: true },
      where: {
        financingPlan: {
          student: estabFilter.establishmentId
            ? { establishmentId: { in: establishmentIds } }
            : {},
        },
      },
    }),
  ]);

  const pending = installmentStats.find((s) => s.status === "PENDING");
  const late = installmentStats.filter((s) => ["LATE", "UNPAID"].includes(s.status));
  const totalRevenueDue = installmentStats.reduce((s, i) => s + (i._sum.amount ?? 0), 0);
  const totalRevenuePaid = installmentStats.reduce((s, i) => s + (i._sum.paidAmount ?? 0), 0);

  return {
    totalStudents,
    activeStudents,
    totalSessions,
    doneSessions,
    pendingInstallments: pending?._count._all ?? 0,
    lateInstallments: late.reduce((s, i) => s + i._count._all, 0),
    totalRevenueDue,
    totalRevenuePaid,
  };
}

export async function getUpcomingSessions(
  establishmentIds?: string[],
  limit = 5
) {
  return prisma.session.findMany({
    where: {
      status: "PLANNED",
      date: { gte: new Date() },
      course: establishmentIds?.length
        ? { establishmentId: { in: establishmentIds } }
        : {},
    },
    include: {
      course: { include: { subject: true, class: true } },
      room: true,
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function getLateInstallments(
  establishmentIds?: string[],
  limit = 10
) {
  return prisma.installment.findMany({
    where: {
      status: { in: ["LATE", "UNPAID"] },
      financingPlan: {
        student: establishmentIds?.length
          ? { establishmentId: { in: establishmentIds } }
          : {},
      },
    },
    include: {
      financingPlan: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        },
      },
      reminders: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}
