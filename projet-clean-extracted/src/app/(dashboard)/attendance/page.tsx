import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessions } from "@/server/queries/planning";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionStatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { classId?: string; teacherId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  // Filtres selon le rôle : un prof ne voit que ses séances
  const teacherFilter =
    session.user.role === "TEACHER" ? session.user.id : searchParams.teacherId;

  const [sessions, classes, teachers] = await Promise.all([
    getSessions({
      classId: searchParams.classId,
      teacherId: teacherFilter,
      status: "DONE", // On affiche les séances réalisées + planifiées récentes
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Sessions sans présences = saisie manquante
  const sessionsWithoutAttendance = sessions.filter((s) => (s as any)._count?.attendances === 0);

  return (
    <div>
      <PageHeader
        title="Présences & Retards"
        description="Saisie et suivi des présences par séance"
      />

      {/* Alerte présences manquantes */}
      {sessionsWithoutAttendance.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {sessionsWithoutAttendance.length} séance{sessionsWithoutAttendance.length > 1 ? "s" : ""} sans présences saisies
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Pensez à saisir les présences pour les séances réalisées.
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      {session.user.role !== "TEACHER" && (
        <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
          <form className="flex flex-wrap gap-3" method="get">
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
            <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
          </form>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm">
        {sessions.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Aucune séance trouvée"
            description="Les séances des 30 derniers jours s'affichent ici."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Séance</th>
                <th className="text-left p-4">Classe</th>
                <th className="text-left p-4">Professeur</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Présences</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const attendanceCount = (s as any)._count?.attendances ?? 0;
                const hasAttendance = attendanceCount > 0;
                return (
                  <tr key={s.id} className={`border-b hover:bg-slate-50 ${!hasAttendance ? "bg-amber-50/30" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.course.subject.color ?? "#6366f1" }} />
                        <span className="font-medium">{s.course.subject.name}</span>
                      </div>
                    </td>
                    <td className="p-4">{s.course.class.name}</td>
                    <td className="p-4 text-slate-500">{s.teacher?.name ?? "—"}</td>
                    <td className="p-4 text-slate-500">{formatDateTime(s.date)}</td>
                    <td className="p-4"><SessionStatusBadge status={s.status} /></td>
                    <td className="p-4">
                      {hasAttendance ? (
                        <Badge variant="success">{attendanceCount} saisi{attendanceCount > 1 ? "es" : "e"}</Badge>
                      ) : (
                        <Badge variant="warning">Non saisie</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Link href={`/planning/sessions/${s.id}`}
                        className="text-xs text-primary hover:underline">
                        Saisir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
