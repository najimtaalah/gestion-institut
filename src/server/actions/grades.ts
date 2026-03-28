"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const evaluationSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  type: z.enum(["EXAM", "TEST", "CONTINUOUS", "PROJECT", "ORAL", "OTHER"]),
  date: z.string().min(1, "Date requise"),
  maxScore: z.coerce.number().min(1).default(20),
  coefficient: z.coerce.number().min(0.1).default(1),
  period: z.string().optional(),
  notes: z.string().optional(),
  subjectId: z.string().min(1),
  classId: z.string().optional(),
});

export async function createEvaluation(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = evaluationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const evaluation = await prisma.evaluation.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      maxScore: parsed.data.maxScore,
      coefficient: parsed.data.coefficient,
      period: parsed.data.period || null,
      notes: parsed.data.notes || null,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId || null,
    },
  });

  revalidatePath("/grades");
  return { id: evaluation.id };
}

/** Sauvegarde en masse les notes d'une évaluation */
export async function saveGrades(
  evaluationId: string,
  grades: { studentId: string; score: number; comment?: string; isAbsent?: boolean }[]
) {
  const session = await auth();
  if (!session) redirect("/login");

  for (const g of grades) {
    await prisma.grade.upsert({
      where: { evaluationId_studentId: { evaluationId, studentId: g.studentId } },
      update: {
        score: g.score,
        comment: g.comment ?? null,
        isAbsent: g.isAbsent ?? false,
      },
      create: {
        evaluationId,
        studentId: g.studentId,
        score: g.score,
        comment: g.comment ?? null,
        isAbsent: g.isAbsent ?? false,
        createdById: session.user.id,
      },
    });
  }

  revalidatePath("/grades");
}
