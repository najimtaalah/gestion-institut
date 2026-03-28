import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateUser } from "@/server/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const [user, establishments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      include: { establishments: { select: { establishmentId: true } } },
    }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!user) notFound();

  const action = updateUser.bind(null, params.id);
  const userEstabIds = user.establishments.map((ue) => ue.establishmentId);

  return (
    <div className="max-w-xl">
      <PageHeader title={`Modifier — ${user.name}`} />
      <form action={action as any} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nom complet *</Label>
            <Input name="name" required defaultValue={user.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input name="email" type="email" required defaultValue={user.email} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Rôle *</Label>
          <select
            name="role"
            defaultValue={user.role}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="SUPER_ADMIN">Super Administrateur</option>
            <option value="ESTABLISHMENT_ADMIN">Administrateur établissement</option>
            <option value="PEDAGOGICAL_MANAGER">Responsable pédagogique</option>
            <option value="LEVEL_MANAGER">Responsable de niveau</option>
            <option value="FINANCIAL_MANAGER">Responsable financier</option>
            <option value="TEACHER">Professeur</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Établissements</Label>
          <div className="rounded-md border border-input bg-background p-3 space-y-2">
            {establishments.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun établissement actif</p>
            ) : (
              establishments.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="establishmentIds"
                    value={e.id}
                    defaultChecked={userEstabIds.includes(e.id)}
                    className="rounded border-gray-300"
                  />
                  <span>{e.name}</span>
                  <span className="text-xs text-slate-400">({e.code})</span>
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-slate-400">Laisser vide pour un accès global (Super Admin).</p>
        </div>

        <div className="space-y-1.5">
          <Label>Nouveau mot de passe</Label>
          <Input
            name="password"
            type="password"
            placeholder="Laisser vide pour ne pas modifier"
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-400">8 caractères minimum. Laisser vide pour conserver l&apos;actuel.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Statut</Label>
          <select
            name="isActive"
            defaultValue={user.isActive ? "true" : "false"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Enregistrer</Button>
          <Link href="/users">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
