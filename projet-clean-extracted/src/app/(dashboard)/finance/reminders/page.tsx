import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { getOverdueInstallments } from "@/server/queries/finance";
import { PageHeader } from "@/components/shared/page-header";
import { InstallmentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatCurrency, formatRelative } from "@/lib/utils";
import { addReminder } from "@/server/actions/finance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function RemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const overdueInstallments = await getOverdueInstallments(
    session.user.role !== "SUPER_ADMIN" ? session.user.establishmentIds : undefined
  );

  const totalOverdue = overdueInstallments.reduce((s, i) => s + (i.amount - i.paidAmount), 0);

  return (
    <div>
      <PageHeader
        title="Impayés & Relances"
        description={`${overdueInstallments.length} échéance${overdueInstallments.length > 1 ? "s" : ""} en retard — ${formatCurrency(totalOverdue)} à recouvrer`}
      />

      {/* Alerte synthèse */}
      {overdueInstallments.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {overdueInstallments.length} échéance{overdueInstallments.length > 1 ? "s" : ""} en retard
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Total impayé : <strong>{formatCurrency(totalOverdue)}</strong>
            </p>
          </div>
        </div>
      )}

      {overdueInstallments.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Aucun impayé en cours"
          description="Tous les paiements sont à jour."
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Étudiant</th>
                <th className="text-left p-4">Échéance</th>
                <th className="text-left p-4">Date limite</th>
                <th className="text-left p-4">Montant dû</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Dernière relance</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overdueInstallments.map((inst) => {
                const lastReminder = inst.reminders[0];
                const dueAmount = inst.amount - inst.paidAmount;

                return (
                  <tr key={inst.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <Link
                        href={`/students/${inst.financingPlan.student.id}/finance`}
                        className="font-medium hover:underline text-primary"
                      >
                        {inst.financingPlan.student.lastName} {inst.financingPlan.student.firstName}
                      </Link>
                      <p className="text-xs text-slate-400">{inst.financingPlan.student.studentCode}</p>
                    </td>
                    <td className="p-4 text-slate-700">{inst.label}</td>
                    <td className="p-4">
                      <span className="text-red-600 font-medium">{formatDate(inst.dueDate)}</span>
                    </td>
                    <td className="p-4 font-semibold">{formatCurrency(dueAmount)}</td>
                    <td className="p-4"><InstallmentStatusBadge status={inst.status} /></td>
                    <td className="p-4 text-xs text-slate-500">
                      {lastReminder ? (
                        <div>
                          <p>{formatRelative(lastReminder.sentAt)}</p>
                          {lastReminder.type === "AUTO" ? (
                            <Badge variant="gray" className="text-xs mt-0.5">Auto</Badge>
                          ) : (
                            <Badge variant="info" className="text-xs mt-0.5">Manuelle</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Jamais relancé</span>
                      )}
                    </td>
                    <td className="p-4">
                      <form
                        action={async () => {
                          "use server";
                          await addReminder(inst.id, { channel: "EMAIL", comment: "Relance manuelle effectuée" });
                        }}
                      >
                        <Button size="sm" variant="outline">
                          <Bell className="h-3.5 w-3.5 mr-1.5" />
                          Relancer
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
