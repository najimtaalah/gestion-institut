"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ── Niveaux ──────────────────────────────────────────────────────────

export async function createLevel(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = Object.fromEntries(formData.entries());
  if (!data.name || !data.establishmentId) return { error: "Données manquantes" };

  await prisma.level.create({
    data: {
      name: data.name as string,
      order: data.order ? parseInt(data.order as string) : 0,
      establishmentId: data.establishmentId as string,
    },
  });

  revalidatePath("/academic/levels");
}

export async function deleteLevel(id: string) {
  await prisma.level.delete({ where: { id } });
  revalidatePath("/academic/levels");
}

// ── Filières ──────────────────────────────────────────────────────────

export async function createField(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = Object.fromEntries(formData.entries());
  await prisma.field.create({
    data: {
      name: data.name as string,
      code: (data.code as string) || null,
      levelId: data.levelId as string,
    },
  });

  revalidatePath("/academic/levels");
}

// ── Classes ───────────────────────────────────────────────────────────

const classSchema = z.object({
  name: z.string().min(1),
  capacity: z.coerce.number().optional(),
  levelId: z.string().min(1),
  fieldId: z.string().optional(),
  establishmentId: z.string().min(1),
});

export async function createClass(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = classSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.class.create({
    data: {
      name: parsed.data.name,
      capacity: parsed.data.capacity ?? null,
      levelId: parsed.data.levelId,
      fieldId: parsed.data.fieldId || null,
      establishmentId: parsed.data.establishmentId,
    },
  });

  revalidatePath("/academic/classes");
}

export async function deleteClass(id: string) {
  await prisma.class.delete({ where: { id } });
  revalidatePath("/academic/classes");
}

// ── Groupes ───────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  await prisma.group.create({
    data: { name: data.name as string, classId: data.classId as string },
  });
  revalidatePath("/academic/classes");
}

// ── Matières ──────────────────────────────────────────────────────────

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  coefficient: z.coerce.number().min(0.1).default(1),
  color: z.string().optional(),
});

export async function createSubject(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const parsed = subjectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.subject.create({ data: parsed.data });
  revalidatePath("/academic/subjects");
}

export async function updateSubject(id: string, formData: FormData) {
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.subject.update({ where: { id }, data: parsed.data });
  revalidatePath("/academic/subjects");
}

export async function deleteSubject(id: string) {
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/academic/subjects");
}

// ── Salles ────────────────────────────────────────────────────────────

const roomSchema = z.object({
  name: z.string().min(1),
  capacity: z.coerce.number().optional(),
  location: z.string().optional(),
  equipment: z.string().optional(),
  establishmentId: z.string().min(1),
});

export async function createRoom(formData: FormData) {
  const parsed = roomSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.room.create({ data: { ...parsed.data, capacity: parsed.data.capacity ?? null } });
  revalidatePath("/rooms");
}

export async function deleteRoom(id: string) {
  await prisma.room.delete({ where: { id } });
  revalidatePath("/rooms");
}
