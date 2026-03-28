"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getNextStudentCode } from "@/server/queries/students";

const studentSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  establishmentId: z.string().min(1, "Établissement requis"),
  levelId: z.string().optional(),
  classId: z.string().optional(),
  groupId: z.string().optional(),
  fieldId: z.string().optional(),
  notes: z.string().optional(),
});

export async function createStudent(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const code = await getNextStudentCode(new Date().getFullYear());

  await prisma.student.create({
    data: {
      studentCode: code,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address || null,
      city: data.city || null,
      establishmentId: data.establishmentId,
      levelId: data.levelId || null,
      classId: data.classId || null,
      groupId: data.groupId || null,
      fieldId: data.fieldId || null,
      notes: data.notes || null,
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE", entity: "Student", userId: session.user.id },
  });

  revalidatePath("/students");
  redirect("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address || null,
      city: data.city || null,
      establishmentId: data.establishmentId,
      levelId: data.levelId || null,
      classId: data.classId || null,
      groupId: data.groupId || null,
      fieldId: data.fieldId || null,
      notes: data.notes || null,
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE", entity: "Student", entityId: id, userId: session.user.id },
  });

  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}

export async function archiveStudent(id: string) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.student.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await prisma.auditLog.create({
    data: { action: "ARCHIVE", entity: "Student", entityId: id, userId: session.user.id },
  });

  revalidatePath("/students");
}
