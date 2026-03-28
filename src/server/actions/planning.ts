"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSessionsForCourse, checkRoomConflict } from "@/server/queries/planning";

const courseSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["PRESENTIAL", "REMOTE", "HYBRID"]),
  dayOfWeek: z.coerce.number().min(0).max(6).optional(),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().optional(),
  isRecurring: z.enum(["true", "false"]).transform((v) => v === "true"),
  visioLink: z.string().optional(),
  notes: z.string().optional(),
  establishmentId: z.string().min(1),
  classId: z.string().min(1),
  groupId: z.string().optional(),
  subjectId: z.string().min(1),
});

export async function createCourse(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const teacherIds = formData.getAll("teacherIds") as string[];

  const course = await prisma.course.create({
    data: {
      title: data.title || null,
      type: data.type,
      dayOfWeek: data.dayOfWeek ?? null,
      startTime: data.startTime,
      endTime: data.endTime,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isRecurring: data.isRecurring,
      visioLink: data.visioLink || null,
      notes: data.notes || null,
      establishmentId: data.establishmentId,
      classId: data.classId,
      groupId: data.groupId || null,
      subjectId: data.subjectId,
      assignments: {
        create: teacherIds.map((id, i) => ({ teacherId: id, isPrimary: i === 0 })),
      },
    },
  });

  if (data.isRecurring) {
    await generateSessionsForCourse(course.id);
  }

  revalidatePath("/planning/courses");
  redirect("/planning/courses");
}

export async function updateCourse(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const teacherIds = formData.getAll("teacherIds") as string[];

  await prisma.courseAssignment.deleteMany({ where: { courseId: id } });

  await prisma.course.update({
    where: { id },
    data: {
      title: data.title || null,
      type: data.type,
      dayOfWeek: data.dayOfWeek ?? null,
      startTime: data.startTime,
      endTime: data.endTime,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isRecurring: data.isRecurring,
      visioLink: data.visioLink || null,
      notes: data.notes || null,
      establishmentId: data.establishmentId,
      classId: data.classId,
      groupId: data.groupId || null,
      subjectId: data.subjectId,
      assignments: {
        create: teacherIds.map((tid, i) => ({ teacherId: tid, isPrimary: i === 0 })),
      },
    },
  });

  revalidatePath("/planning/courses");
  redirect("/planning/courses");
}

export async function updateSession(
  id: string,
  data: {
    status?: string;
    notes?: string;
    incident?: string;
    cancelReason?: string;
    roomId?: string;
    teacherId?: string;
  }
) {
  const session = await auth();
  if (!session) redirect("/login");

  // Vérification conflit salle si changement de salle
  if (data.roomId) {
    const existing = await prisma.session.findUnique({ where: { id } });
    if (existing) {
      const conflict = await checkRoomConflict(data.roomId, existing.date, existing.endTime, id);
      if (conflict) return { error: "Conflit de salle détecté pour ce créneau." };
    }
  }

  await prisma.session.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as any }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.incident !== undefined && { incident: data.incident }),
      ...(data.cancelReason !== undefined && { cancelReason: data.cancelReason }),
      ...(data.roomId && { roomId: data.roomId }),
      ...(data.teacherId && { teacherId: data.teacherId }),
    },
  });

  revalidatePath(`/planning/sessions/${id}`);
  revalidatePath("/planning/sessions");
}

export async function saveAttendance(
  sessionId: string,
  attendances: { studentId: string; status: string; lateMinutes?: number; comment?: string }[]
) {
  const session = await auth();
  if (!session) redirect("/login");

  for (const a of attendances) {
    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId: a.studentId } },
      update: {
        status: a.status as any,
        lateMinutes: a.lateMinutes ?? null,
        comment: a.comment ?? null,
      },
      create: {
        sessionId,
        studentId: a.studentId,
        status: a.status as any,
        lateMinutes: a.lateMinutes ?? null,
        comment: a.comment ?? null,
        createdById: session.user.id,
      },
    });
  }

  // Marquer la séance comme réalisée si elle était planifiée
  await prisma.session.updateMany({
    where: { id: sessionId, status: "PLANNED" },
    data: { status: "DONE" },
  });

  revalidatePath(`/planning/sessions/${sessionId}`);
  revalidatePath("/attendance");
}
