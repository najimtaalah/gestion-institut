import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getInstallments } from "@/server/queries/finance";
import { PageHeader } from "@/components/shared/page-header";
import { InstallmentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; from?: string; to?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const installments = await getInstallments({
    establishmentIds: session.user.role !== "SUPER_ADMIN" ? session.user.establishmentIds : undefined,
    status: searchParams.status,
    from: searchParams.from ? new Date(searchParams.from) : undefined,
    to: searchParams.to ? new Date(searchParams.to) : undefined,
  });

  const totalDue = installments.reduce((s, i) => s + i.amount, 0);
  const totalPaid = installments.reduce((s, i) => s + i.paidAmount, 0);

  return (
    <div>
      <PageHeader
        title="Échéanciers"
        description={`${installments.length} échéance${installments.length > 1 ? "s" : ""} · ${formatCurrency(totalPaid)} encaissé / ${formatCurrency(totalDue)} attendu`}
      />

      {/* Filtres */}
      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <select name="status" defaultValue={searchParams.status ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Tous les statuts</option>
            <option value="PENDING">À payer</option>
            <option value="PARTIAL">Partiel</option>
            <option value="PAID">Payé</option>
            <option value="LATE">En retard</option>
            <option value="UNPAID">Impayé</option>
          </select>
          <input type="date" name="from" defaultValue={searchParams.from}
            className="text-sm border rounded-md px-2 py-1" />
          <input type="date" name="to" defaultValue={searchParams.to}
            className="text-sm border rounded-md px-2 py-1" />
          <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
        </form>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {installments.length === 0 ? (
          <EmptyState icon={Euro} title="Aucune échéance trouvée" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Étudiant</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-left p-4">Échéance</th>
                <th className="text-left p-4">Date</th>
                <th className="text-right p-4">Montant</th>
                <th className="text-right p-4">Payé</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst) => (
                <tr key={inst.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <Link href={`/students/${inst.financingPlan.student.id}`}
                      className="font-medium text-primary hover:underline">
                      {inst.financingPlan.student.lastName} {inst.financingPlan.student.firstName}
                    </Link>
                    <p className="text-xs text-slate-400">{inst.financingPlan.student.studentCode}</p>
                  </td>
                  <td className="p-4 text-slate-500">{inst.financingPlan.label}</td>
                  <td className="p-4">{inst.label}</td>
                  <td className="p-4 text-slate-500">{formatDate(inst.dueDate)}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(inst.amount)}</td>
                  <td className="p-4 text-right">
                    <span className={inst.paidAmount >= inst.amount ? "text-green-600 font-semibold" : "text-slate-700"}>
                      {formatCurrency(inst.paidAmount)}
                    </span>
                  </td>
                  <td className="p-4"><InstallmentStatusBadge status={inst.status} /></td>
                  <td className="p-4">
                    <Link href={`/students/${inst.financingPlan.student.id}?tab=finance`}
                      className="text-xs text-primary hover:underline">
                      Gérer →
                    </Link>
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
