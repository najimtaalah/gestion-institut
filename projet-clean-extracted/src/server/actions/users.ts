"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const userSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "PEDAGOGICAL_MANAGER", "LEVEL_MANAGER", "FINANCIAL_MANAGER", "TEACHER"]),
  password: z.string().min(8, "8 caractères minimum").optional().or(z.literal("")),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) {
    return { error: "Non autorisé" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const estabIds = formData.getAll("establishmentIds") as string[];

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { error: { email: ["Cet email est déjà utilisé"] } };

  const hash = await bcrypt.hash(parsed.data.password || "TempPass123!", 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: hash,
      isActive: parsed.data.isActive,
      establishments: {
        create: estabIds.map((id) => ({ establishmentId: id })),
      },
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE", entity: "User", entityId: user.id, userId: session.user.id },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) {
    return { error: "Non autorisé" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const estabIds = formData.getAll("establishmentIds") as string[];

  await prisma.userEstablishment.deleteMany({ where: { userId: id } });

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
      establishments: {
        create: estabIds.map((eid) => ({ establishmentId: eid })),
      },
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
}
