import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createStudent } from "@/server/actions/students";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function NewStudentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [establishments, levels, classes] = await Promise.all([
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.level.findMany({ include: { establishment: true }, orderBy: { order: "asc" } }),
    prisma.class.findMany({ include: { level: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nouvel étudiant"
        description="Créer un dossier étudiant"
      />

      <form action={createStudent as any} className="space-y-6">
        {/* Identité */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" />
            </div>
          </div>
        </div>

        {/* Scolarité */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Scolarité</h2>
          <div className="space-y-1.5">
            <Label htmlFor="establishmentId">Établissement *</Label>
            <select id="establishmentId" name="establishmentId" required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">Sélectionner…</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="levelId">Niveau</Label>
              <select id="levelId" name="levelId"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">—</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.establishment.name})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="classId">Classe</Label>
              <select id="classId" name="classId"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">—</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level.name})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes internes</Label>
            <textarea id="notes" name="notes" rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Créer l&apos;étudiant</Button>
          <Link href="/students"><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
