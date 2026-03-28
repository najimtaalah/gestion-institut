import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  GraduationCap, Calendar, Euro, AlertTriangle,
  TrendingUp, BookOpen, Clock, CheckCircle2
} from "lucide-react";
import { getDashboardStats, getUpcomingSessions, getLateInstallments } from "@/server/queries/dashboard";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { InstallmentStatusBadge, SessionStatusBadge, CourseTypeBadge } from "@/components/shared/status-badge";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isRestricted = !["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role);
  const estabIds = isRestricted ? session.user.establishmentIds : undefined;

  const [stats, upcomingSessions, lateInstallments] = await Promise.all([
    getDashboardStats(estabIds),
    getUpcomingSessions(estabIds, 5),
    ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"].includes(session.user.role)
      ? getLateInstallments(estabIds, 8)
      : Promise.resolve([]),
  ]);

  const collectionRate = stats.totalRevenueDue > 0
    ? Math.round((stats.totalRevenuePaid / stats.totalRevenueDue) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${session.user.name?.split(" ")[0]} 👋`}
        description="Vue d'ensemble de l'activité de l'institut"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Étudiants actifs"
          value={stats.activeStudents}
          description={`${stats.totalStudents} au total`}
          icon={GraduationCap}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Séances réalisées"
          value={stats.doneSessions}
          description={`${stats.totalSessions} planifiées`}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
        <StatCard
          title="Échéances à payer"
          value={stats.pendingInstallments}
          description={stats.lateInstallments > 0 ? `dont ${stats.lateInstallments} en retard` : "Tout est à jour"}
          icon={stats.lateInstallments > 0 ? AlertTriangle : Euro}
          iconColor={stats.lateInstallments > 0 ? "text-amber-600" : "text-emerald-600"}
        />
        <StatCard
          title="Taux de recouvrement"
          value={`${collectionRate}%`}
          description={`${formatCurrency(stats.totalRevenuePaid)} / ${formatCurrency(stats.totalRevenueDue)}`}
          icon={TrendingUp}
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochaines séances */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Prochaines séances</h2>
            </div>
            <Link href="/planning/sessions" className="text-xs text-primary hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y">
            {upcomingSessions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Aucune séance planifiée à venir
              </div>
            ) : (
              upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/planning/sessions/${s.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.course.subject.color ?? "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {s.course.subject.name} — {s.course.class.name}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(s.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CourseTypeBadge type={s.type} />
                    {s.room && (
                      <span className="text-xs text-slate-400">{s.room.name}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Impayés */}
        {["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"].includes(session.user.role) && (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-slate-800">Impayés & Retards</h2>
              </div>
              <Link href="/finance/reminders" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="divide-y">
              {lateInstallments.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Aucun impayé en cours 🎉
                </div>
              ) : (
                lateInstallments.map((inst) => (
                  <Link
                    key={inst.id}
                    href={`/students/${inst.financingPlan.student.id}/finance`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {inst.financingPlan.student.firstName} {inst.financingPlan.student.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{inst.label}</p>
                      <p className="text-xs text-slate-400">Échéance : {formatDate(inst.dueDate)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(inst.amount - inst.paidAmount)}</p>
                      <InstallmentStatusBadge status={inst.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
