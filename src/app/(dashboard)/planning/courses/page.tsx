import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { getCourses } from "@/server/queries/planning";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseTypeBadge } from "@/components/shared/status-badge";
import { DAY_LABELS_FULL } from "@/lib/utils";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { establishmentId?: string; classId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [courses, establishments, classes] = await Promise.all([
    getCourses(searchParams.establishmentId, searchParams.classId),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Cours"
        description={`${courses.length} cours défini${courses.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/planning/courses/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau cours</Button>
          </Link>
        }
      />

      {/* Filtres */}
      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <select name="establishmentId" defaultValue={searchParams.establishmentId ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Tous les établissements</option>
            {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select name="classId" defaultValue={searchParams.classId ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
        </form>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {courses.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aucun cours"
            description="Créez votre premier cours pour générer des séances."
            action={<Link href="/planning/courses/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau cours</Button></Link>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Couleur</th>
                <th className="text-left p-4">Cours</th>
                <th className="text-left p-4">Classe</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Horaires</th>
                <th className="text-left p-4">Professeur(s)</th>
                <th className="text-left p-4">Séances</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: c.subject.color ?? "#6366f1" }} />
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{c.subject.name}</p>
                    {c.title && <p className="text-xs text-slate-400">{c.title}</p>}
                  </td>
                  <td className="p-4">
                    {c.class.name}
                    {c.group && <span className="text-xs text-slate-400"> / {c.group.name}</span>}
                  </td>
                  <td className="p-4"><CourseTypeBadge type={c.type} /></td>
                  <td className="p-4 text-slate-500">
                    {c.dayOfWeek !== null && <p className="text-xs">{DAY_LABELS_FULL[c.dayOfWeek]}</p>}
                    <p>{c.startTime} – {c.endTime}</p>
                    {c.isRecurring && <Badge variant="info" className="text-xs mt-0.5">Récurrent</Badge>}
                  </td>
                  <td className="p-4 text-slate-500">
                    {c.assignments.map((a) => a.teacher.name).join(", ") || "—"}
                  </td>
                  <td className="p-4 text-slate-500">{(c as any)._count?.sessions ?? 0}</td>
                  <td className="p-4">
                    <Link href={`/planning/courses/${c.id}/edit`}
                      className="text-xs text-primary hover:underline">Modifier</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
