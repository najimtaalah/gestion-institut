import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/server/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function NewUserPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const roles = [
    { value: "ESTABLISHMENT_ADMIN", label: "Admin Établissement" },
    { value: "PEDAGOGICAL_MANAGER", label: "Responsable Pédago" },
    { value: "LEVEL_MANAGER", label: "Responsable Niveau" },
    { value: "FINANCIAL_MANAGER", label: "Gestionnaire Finance" },
    { value: "TEACHER", label: "Professeur" },
    ...(session.user.role === "SUPER_ADMIN" ? [{ value: "SUPER_ADMIN", label: "Super Admin" }] : []),
  ];

  return (
    <div className="max-w-xl">
      <PageHeader title="Nouvel utilisateur" />
      <form action={createUser as any} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nom complet *</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input name="email" type="email" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <select name="role" required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe provisoire *</Label>
            <Input name="password" type="password" required minLength={8}
              placeholder="8 caractères minimum" />
          </div>
          <input type="hidden" name="isActive" value="true" />
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800">Accès établissements</h3>
          <p className="text-xs text-slate-500">Laissez vide pour un accès global (Super Admin uniquement)</p>
          <div className="space-y-2">
            {establishments.map((e) => (
              <label key={e.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="establishmentIds" value={e.id}
                  className="rounded border-input" />
                <span className="text-sm">{e.name}</span>
                <span className="text-xs text-slate-400 font-mono">{e.code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Créer l&apos;utilisateur</Button>
          <Link href="/users"><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
