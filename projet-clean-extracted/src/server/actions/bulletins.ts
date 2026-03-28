"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { weightedAverage } from "@/lib/utils";

/**
 * Génère (ou regénère) le bulletin d'un étudiant pour une période donnée.
 * Calcule les moyennes par matière et la moyenne générale.
 */
export async function generateBulletin(studentId: string, bulletinPeriodId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  const period = await prisma.bulletinPeriod.findUnique({ where: { id: bulletinPeriodId } });
  if (!period) return { error: "Période introuvable" };

  // Récupère les notes de la période
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      evaluation: { period: period.periodCode },
    },
    include: { evaluation: { include: { subject: true } } },
  });

  // Regroupe par matière
  const subjectMap = new Map<
    string,
    { name: string; coefficient: number; scores: { score: number; maxScore: number; coeff: number }[] }
  >();

  for (const grade of grades) {
    const subj = grade.evaluation.subject;
    if (!subjectMap.has(subj.id)) {
      subjectMap.set(subj.id, { name: subj.name, coefficient: subj.coefficient, scores: [] });
    }
    subjectMap.get(subj.id)!.scores.push({
      score: grade.score,
      maxScore: grade.evaluation.maxScore,
      coeff: grade.evaluation.coefficient,
    });
  }

  // Calcule les moyennes par matière
  const subjectLines = Array.from(subjectMap.entries()).map(([, s]) => {
    const avg = weightedAverage(s.scores.map((sc) => ({ score: sc.score, coefficient: sc.coeff, maxScore: sc.maxScore })));
    return { subjectName: s.name, coefficient: s.coefficient, average: avg };
  });

  // Moyenne générale pondérée
  const overallItems = subjectLines
    .filter((l) => l.average !== null)
    .map((l) => ({ score: l.average!, coefficient: l.coefficient, maxScore: 20 }));
  const overallAverage = weightedAverage(overallItems);

  // Comptage absences/retards
  const [totalAbsences, totalLates] = await Promise.all([
    prisma.attendance.count({
      where: {
        studentId,
        status: "ABSENT",
        session: { date: { gte: period.startDate, lte: period.endDate } },
      },
    }),
    prisma.attendance.count({
      where: {
        studentId,
        status: "LATE",
        session: { date: { gte: period.startDate, lte: period.endDate } },
      },
    }),
  ]);

  // Upsert du bulletin
  const bulletin = await prisma.bulletin.upsert({
    where: { studentId_bulletinPeriodId: { studentId, bulletinPeriodId } },
    update: {
      overallAverage,
      totalAbsences,
      totalLates,
      status: "DRAFT",
    },
    create: {
      studentId,
      bulletinPeriodId,
      overallAverage,
      totalAbsences,
      totalLates,
      status: "DRAFT",
    },
  });

  // Recrée les lignes matière
  await prisma.bulletinSubjectLine.deleteMany({ where: { bulletinId: bulletin.id } });
  await prisma.bulletinSubjectLine.createMany({
    data: subjectLines.map((l) => ({ ...l, bulletinId: bulletin.id })),
  });

  revalidatePath("/bulletins");
  return { bulletinId: bulletin.id };
}

/** Valide un bulletin (le verrouille) */
export async function validateBulletin(bulletinId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.bulletin.update({
    where: { id: bulletinId },
    data: {
      status: "VALIDATED",
      validatedAt: new Date(),
      validatedById: session.user.id,
    },
  });

  revalidatePath("/bulletins");
  revalidatePath(`/bulletins/${bulletinId}`);
}

/** Met à jour les champs éditables d'un bulletin */
export async function updateBulletinComments(
  bulletinId: string,
  data: { generalComment?: string; teacherComment?: string }
) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.bulletin.update({
    where: { id: bulletinId },
    data: {
      generalComment: data.generalComment ?? undefined,
      teacherComment: data.teacherComment ?? undefined,
    },
  });

  revalidatePath(`/bulletins/${bulletinId}`);
}

/** Met à jour l'appréciation d'une ligne matière */
export async function updateSubjectLineComment(lineId: string, comment: string) {
  await prisma.bulletinSubjectLine.update({
    where: { id: lineId },
    data: { comment },
  });
}
