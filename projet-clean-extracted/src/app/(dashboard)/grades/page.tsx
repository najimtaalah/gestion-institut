import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createEvaluation } from "@/server/actions/grades";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: { subjectId?: string; classId?: string; period?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [evaluations, subjects, classes] = await Promise.all([
    prisma.evaluation.findMany({
      where: {
        ...(searchParams.subjectId && { subjectId: searchParams.subjectId }),
        ...(searchParams.classId && { classId: searchParams.classId }),
        ...(searchParams.period && { period: searchParams.period }),
      },
      include: {
        subject: true,
        _count: { select: { grades: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Notes & Évaluations"
        description={`${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire nouvelle évaluation */}
        <div className="rounded-xl border bg-white p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Nouvelle évaluation</h2>
          <form action={createEvaluation as any} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input name="title" required placeholder="ex: Contrôle chapitre 1" />
            </div>
            <div className="space-y-1.5">
              <Label>Matière *</Label>
              <select name="subjectId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Classe</Label>
              <select name="classId"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Toutes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select name="type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="TEST">Contrôle</option>
                <option value="EXAM">Examen</option>
                <option value="CONTINUOUS">Contrôle continu</option>
                <option value="PROJECT">Projet</option>
                <option value="ORAL">Oral</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>Note sur</Label>
                <Input name="maxScore" type="number" defaultValue="20" min="1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Coefficient</Label>
                <Input name="coefficient" type="number" defaultValue="1" min="0.1" step="0.5" />
              </div>
              <div className="space-y-1.5">
                <Label>Période</Label>
                <Input name="period" placeholder="ex: S1" />
              </div>
            </div>
            <Button type="submit" className="w-full">Créer</Button>
          </form>
        </div>

        {/* Liste évaluations */}
        <div className="lg:col-span-2">
          {/* Filtres */}
          <div className="rounded-xl border bg-white p-3 mb-3 shadow-sm">
            <form className="flex flex-wrap gap-2" method="get">
              <select name="subjectId" defaultValue={searchParams.subjectId ?? ""}
                className="text-sm border rounded-md px-2 py-1">
                <option value="">Toutes les matières</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select name="classId" defaultValue={searchParams.classId ?? ""}
                className="text-sm border rounded-md px-2 py-1">
                <option value="">Toutes les classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input name="period" defaultValue={searchParams.period} placeholder="Période (S1…)" className="h-7 text-xs w-24" />
              <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
            </form>
          </div>

          {evaluations.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState icon={BarChart3} title="Aucune évaluation" description="Créez votre première évaluation." />
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500 bg-slate-50">
                    <th className="text-left p-4">Évaluation</th>
                    <th className="text-left p-4">Matière</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Barème</th>
                    <th className="text-left p-4">Coeff.</th>
                    <th className="text-left p-4">Période</th>
                    <th className="text-left p-4">Notes saisies</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium">{e.title}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: e.subject.color ?? "#6366f1" }} />
                          {e.subject.name}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(e.date)}</td>
                      <td className="p-4 text-slate-500">/{e.maxScore}</td>
                      <td className="p-4 text-slate-500">×{e.coefficient}</td>
                      <td className="p-4">
                        {e.period ? <Badge variant="info">{e.period}</Badge> : "—"}
                      </td>
                      <td className="p-4 text-slate-500">{e._count.grades}</td>
                      <td className="p-4">
                        <Link href={`/grades/${e.id}`}
                          className="text-xs text-primary hover:underline">
                          Saisir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
