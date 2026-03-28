"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recalculateInstallmentStatus } from "@/server/queries/finance";
import { redirect } from "next/navigation";

// ── Plan de financement ──────────────────────────────────────────────

const planSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  totalAmount: z.coerce.number().min(1, "Montant requis"),
  notes: z.string().optional(),
  studentId: z.string().min(1),
});

export async function createFinancingPlan(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = planSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.financingPlan.create({
    data: {
      label: parsed.data.label,
      totalAmount: parsed.data.totalAmount,
      notes: parsed.data.notes || null,
      studentId: parsed.data.studentId,
    },
  });

  revalidatePath(`/students/${parsed.data.studentId}/finance`);
}

// ── Échéances ────────────────────────────────────────────────────────

const installmentSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  dueDate: z.string().min(1, "Date requise"),
  amount: z.coerce.number().min(1, "Montant requis"),
  financingPlanId: z.string().min(1),
  notes: z.string().optional(),
});

export async function createInstallment(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = installmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.installment.create({
    data: {
      label: parsed.data.label,
      dueDate: new Date(parsed.data.dueDate),
      amount: parsed.data.amount,
      notes: parsed.data.notes || null,
      financingPlanId: parsed.data.financingPlanId,
    },
  });

  revalidatePath("/finance/installments");
}

// ── Paiements ────────────────────────────────────────────────────────

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Montant requis"),
  paidAt: z.string().min(1, "Date requise"),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  installmentId: z.string().min(1),
});

export async function registerPayment(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.payment.create({
    data: {
      amount: parsed.data.amount,
      paidAt: new Date(parsed.data.paidAt),
      method: parsed.data.method || null,
      reference: parsed.data.reference || null,
      notes: parsed.data.notes || null,
      installmentId: parsed.data.installmentId,
    },
  });

  await recalculateInstallmentStatus(parsed.data.installmentId);

  await prisma.auditLog.create({
    data: {
      action: "PAYMENT_REGISTERED",
      entity: "Installment",
      entityId: parsed.data.installmentId,
      userId: session.user.id,
    },
  });

  revalidatePath("/finance/installments");
  revalidatePath("/finance/reminders");
}

// ── Relances ─────────────────────────────────────────────────────────

export async function addReminder(
  installmentId: string,
  data: { channel: string; comment?: string }
) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.reminder.create({
    data: {
      type: "MANUAL",
      channel: data.channel as any,
      comment: data.comment || null,
      installmentId,
      authorId: session.user.id,
    },
  });

  revalidatePath("/finance/reminders");
}

// ── Relances auto : déclenche pour les échéances J+X ─────────────────

export async function processAutoReminders() {
  const rules = await prisma.reminderRule.findMany({ where: { isActive: true } });
  const today = new Date();

  for (const rule of rules) {
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() - rule.daysAfterDueDate);

    const overdueInstallments = await prisma.installment.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL", "LATE"] },
        dueDate: {
          lte: threshold,
          gte: new Date(threshold.getTime() - 24 * 60 * 60 * 1000), // fenêtre 24h
        },
        // Pas déjà relancé aujourd'hui avec cette règle
        reminders: {
          none: {
            type: "AUTO",
            channel: rule.channel,
            sentAt: { gte: new Date(today.setHours(0, 0, 0, 0)) },
          },
        },
      },
    });

    for (const inst of overdueInstallments) {
      await prisma.reminder.create({
        data: {
          type: "AUTO",
          channel: rule.channel,
          comment: `Relance automatique : ${rule.name}`,
          installmentId: inst.id,
        },
      });
    }
  }
}
