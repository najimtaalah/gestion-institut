"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const estabSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  code: z.string().min(2, "Code requis").max(10).toUpperCase(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),
});

export async function createEstablishment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") return { error: "Non autorisé" };

  const parsed = estabSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await prisma.establishment.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: { code: ["Ce code est déjà utilisé"] } };

  await prisma.establishment.create({ data: { ...parsed.data, email: parsed.data.email || null } });

  revalidatePath("/establishments");
  redirect("/establishments");
}

export async function updateEstablishment(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") return { error: "Non autorisé" };

  const parsed = estabSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.establishment.update({
    where: { id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  revalidatePath("/establishments");
  redirect("/establishments");
}

export async function toggleEstablishment(id: string, isActive: boolean) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") return { error: "Non autorisé" };

  await prisma.establishment.update({ where: { id }, data: { isActive } });
  revalidatePath("/establishments");
}
