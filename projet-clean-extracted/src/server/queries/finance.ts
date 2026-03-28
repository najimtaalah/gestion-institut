import { prisma } from "@/lib/prisma";

export async function getFinancingPlan(studentId: string) {
  return prisma.financingPlan.findMany({
    where: { studentId, isActive: true },
    include: {
      installments: {
        include: {
          payments: { orderBy: { paidAt: "desc" } },
          reminders: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { sentAt: "desc" },
          },
        },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInstallments(filters: {
  establishmentIds?: string[];
  status?: string;
  from?: Date;
  to?: Date;
}) {
  return prisma.installment.findMany({
    where: {
      ...(filters.status && { status: filters.status as any }),
      ...(filters.from && { dueDate: { gte: filters.from } }),
      ...(filters.to && { dueDate: { lte: filters.to } }),
      financingPlan: {
        student: filters.establishmentIds?.length
          ? { establishmentId: { in: filters.establishmentIds } }
          : {},
      },
    },
    include: {
      financingPlan: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true, establishmentId: true } },
        },
      },
      payments: { orderBy: { paidAt: "desc" } },
      reminders: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function getOverdueInstallments(establishmentIds?: string[]) {
  const today = new Date();
  return prisma.installment.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "LATE"] },
      dueDate: { lt: today },
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
      payments: { orderBy: { paidAt: "desc" }, take: 1 },
    },
    orderBy: { dueDate: "asc" },
  });
}

/** Recalcule et met à jour le statut d'une échéance après un paiement */
export async function recalculateInstallmentStatus(installmentId: string) {
  const inst = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { payments: true },
  });
  if (!inst) return;

  const totalPaid = inst.payments.reduce((s, p) => s + p.amount, 0);
  const today = new Date();
  let status: "PENDING" | "PARTIAL" | "PAID" | "LATE" | "UNPAID" = "PENDING";

  if (totalPaid >= inst.amount) {
    status = "PAID";
  } else if (totalPaid > 0) {
    status = inst.dueDate < today ? "LATE" : "PARTIAL";
  } else if (inst.dueDate < today) {
    status = "LATE";
  }

  await prisma.installment.update({
    where: { id: installmentId },
    data: { paidAmount: totalPaid, status },
  });

  // Recalcule aussi le plan de financement
  const plan = await prisma.financingPlan.findUnique({
    where: { id: inst.financingPlanId },
    include: { installments: true },
  });
  if (plan) {
    const planPaid = plan.installments.reduce((s, i) => s + i.paidAmount, 0);
    await prisma.financingPlan.update({
      where: { id: plan.id },
      data: { paidAmount: planPaid },
    });
  }
}
