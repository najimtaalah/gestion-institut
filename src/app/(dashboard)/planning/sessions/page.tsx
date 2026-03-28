import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Filter } from "lucide-react";
import { getSessions } from "@/server/queries/planning";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionStatusBadge, CourseTypeBadge } from "@/components/shared/status-badge";
import { formatDateTime, DAY_LABELS_FULL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { classId?: string; teacherId?: string; week?: string; status?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  // Semaine courante
  const weekOffset = Number(searchParams.week ?? 0);
  const base = new Date();
  const weekStart = startOfWeek(addWeeks(base, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(base, weekOffset), { weekStartsOn: 1 });

  const [sessions, classes, teachers] = await Promise.all([
    getSessions({
      classId: searchParams.classId,
      teacherId: searchParams.teacherId,
      status: searchParams.status,
      from: weekStart,
      to: weekEnd,
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Groupement par jour
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = format(new Date(s.date), "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return (
    <div>
      <PageHeader
        title="Séances"
        description={`Semaine du ${format(weekStart, "d MMM", { locale: fr })} au ${format(weekEnd, "d MMM yyyy", { locale: fr })}`}
        actions={
          <div className="flex gap-2">
            <Link href={`?week=${weekOffset - 1}`}><Button size="sm" variant="outline">← Précédente</Button></Link>
            <Link href="?week=0"><Button size="sm" variant="outline">Cette semaine</Button></Link>
            <Link href={`?week=${weekOffset + 1}`}><Button size="sm" variant="outline">Suivante →</Button></Link>
          </div>
        }
      />

      {/* Filtres */}
      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <input type="hidden" name="week" value={weekOffset} />
          <select name="classId" defaultValue={searchParams.classId ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="teacherId" defaultValue={searchParams.teacherId ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Tous les professeurs</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select name="status" defaultValue={searchParams.status ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Tous les statuts</option>
            <option value="PLANNED">Planifiée</option>
            <option value="DONE">Réalisée</option>
            <option value="CANCELLED">Annulée</option>
            <option value="POSTPONED">Reportée</option>
          </select>
          <Button type="submit" size="sm" variant="secondary">
            <Filter className="h-3.5 w-3.5 mr-1.5" />Filtrer
          </Button>
        </form>
      </div>

      {/* Vue calendrier semaine */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucune séance cette semaine"
          description="Utilisez les flèches pour naviguer ou créez des cours récurrents."
        />
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => {
            const day = addWeeks(weekStart, 0);
            day.setDate(weekStart.getDate() + i);
            const key = format(day, "yyyy-MM-dd");
            const daySessions = byDay.get(key) ?? [];
            if (daySessions.length === 0) return null;

            return (
              <div key={key} className="rounded-xl border bg-white shadow-sm">
                <div className="px-5 py-3 border-b bg-slate-50 rounded-t-xl">
                  <p className="text-sm font-semibold text-slate-700">
                    {DAY_LABELS_FULL[day.getDay()]} {format(day, "d MMMM", { locale: fr })}
                  </p>
                </div>
                <div className="divide-y">
                  {daySessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/planning/sessions/${s.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="h-full w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: s.course.subject.color ?? "#6366f1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800">
                          {s.course.subject.name} — {s.course.class.name}
                          {s.course.group && ` (${s.course.group.name})`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(s.date), "HH:mm")} → {format(new Date(s.endTime), "HH:mm")}
                          {s.teacher && ` · ${s.teacher.name}`}
                          {s.room && ` · ${s.room.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CourseTypeBadge type={s.type} />
                        <SessionStatusBadge status={s.status} />
                        {(s as any)._count?.attendances > 0 && (
                          <span className="text-xs text-slate-400">{(s as any)._count.attendances} présences</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
