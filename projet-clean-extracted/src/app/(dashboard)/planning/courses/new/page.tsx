import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCourse } from "@/server/actions/planning";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [establishments, classes, subjects, teachers] = await Promise.all([
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ include: { level: true }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "TEACHER", isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau cours" description="Définir un cours et ses séances" />

      <form action={createCourse as any} className="space-y-6">
        {/* Identité du cours */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Cours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Établissement *</Label>
              <select name="establishmentId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Matière *</Label>
              <select name="subjectId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <select name="classId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.level.name})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <select name="type" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="PRESENTIAL">Présentiel</option>
                <option value="REMOTE">Distanciel</option>
                <option value="HYBRID">Hybride</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Titre (optionnel)</Label>
            <Input name="title" placeholder="ex: Mathématiques — 1ère A" />
          </div>
          <div className="space-y-1.5">
            <Label>Lien visio (si distanciel/hybride)</Label>
            <Input name="visioLink" placeholder="https://meet.example.com/…" />
          </div>
        </div>

        {/* Horaires */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Horaires</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Heure début *</Label>
              <Input name="startTime" type="time" required />
            </div>
            <div className="space-y-1.5">
              <Label>Heure fin *</Label>
              <Input name="endTime" type="time" required />
            </div>
            <div className="space-y-1.5">
              <Label>Jour de la semaine</Label>
              <select name="dayOfWeek"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">—</option>
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date de début *</Label>
              <Input name="startDate" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label>Date de fin</Label>
              <Input name="endDate" type="date" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select name="isRecurring"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="true">Cours récurrent (génération auto des séances)</option>
              <option value="false">Cours ponctuel</option>
            </select>
          </div>
        </div>

        {/* Professeurs */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800">Professeur(s)</h2>
          <div className="space-y-2">
            {teachers.map((t) => (
              <label key={t.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="teacherIds" value={t.id} className="rounded border-input" />
                <span className="text-sm">{t.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Créer le cours</Button>
          <Link href="/planning/courses"><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
