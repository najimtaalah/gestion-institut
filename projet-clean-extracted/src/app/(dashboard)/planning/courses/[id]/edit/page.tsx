import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCourse } from "@/server/actions/planning";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [course, establishments, classes, groups, subjects, teachers] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.id },
      include: {
        assignments: { select: { teacherId: true } },
      },
    }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!course) notFound();

  const action = updateCourse.bind(null, params.id);
  const assignedTeacherIds = course.assignments.map((a) => a.teacherId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifier le cours" />
      <form action={action as any} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Établissement *</Label>
            <select
              name="establishmentId"
              required
              defaultValue={course.establishmentId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Matière *</Label>
            <select
              name="subjectId"
              required
              defaultValue={course.subjectId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Titre (optionnel)</Label>
          <Input name="title" defaultValue={course.title ?? ""} placeholder="ex: Cours magistral" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Classe *</Label>
            <select
              name="classId"
              required
              defaultValue={course.classId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Groupe (optionnel)</Label>
            <select
              name="groupId"
              defaultValue={course.groupId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Aucun groupe —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <select
              name="type"
              defaultValue={course.type}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="PRESENTIAL">Présentiel</option>
              <option value="REMOTE">À distance</option>
              <option value="HYBRID">Hybride</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Jour de la semaine</Label>
            <select
              name="dayOfWeek"
              defaultValue={course.dayOfWeek?.toString() ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Ponctuel —</option>
              <option value="1">Lundi</option>
              <option value="2">Mardi</option>
              <option value="3">Mercredi</option>
              <option value="4">Jeudi</option>
              <option value="5">Vendredi</option>
              <option value="6">Samedi</option>
              <option value="0">Dimanche</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Heure de début *</Label>
            <Input name="startTime" type="time" required defaultValue={course.startTime} />
          </div>
          <div className="space-y-1.5">
            <Label>Heure de fin *</Label>
            <Input name="endTime" type="time" required defaultValue={course.endTime} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date de début *</Label>
            <Input
              name="startDate"
              type="date"
              required
              defaultValue={course.startDate.toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date de fin</Label>
            <Input
              name="endDate"
              type="date"
              defaultValue={course.endDate ? course.endDate.toISOString().split("T")[0] : ""}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="hidden"
            name="isRecurring"
            value={course.isRecurring ? "true" : "false"}
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={course.isRecurring}
              onChange={(e) => {
                const hidden = e.currentTarget.closest("form")?.querySelector<HTMLInputElement>('input[name="isRecurring"]');
                if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
              }}
              className="rounded border-gray-300"
            />
            Cours récurrent (hebdomadaire)
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>Lien visio</Label>
          <Input name="visioLink" defaultValue={course.visioLink ?? ""} placeholder="https://meet.google.com/..." />
        </div>

        <div className="space-y-1.5">
          <Label>Professeur(s)</Label>
          <div className="rounded-md border border-input bg-background p-3 space-y-2 max-h-48 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun professeur actif</p>
            ) : (
              teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="teacherIds"
                    value={t.id}
                    defaultChecked={assignedTeacherIds.includes(t.id)}
                    className="rounded border-gray-300"
                  />
                  {t.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes internes</Label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={course.notes ?? ""}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Enregistrer</Button>
          <Link href="/planning/courses">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
