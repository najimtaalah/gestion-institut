import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Euro } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function FinancePlansPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const plans = await prisma.financingPlan.findMany({
    where: {
      isActive: true,
      ...(session.user.role !== "SUPER_ADMIN" && {
        student: { establishmentId: { in: session.user.establishmentIds } },
      }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      installments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Plans de financement" description={`${plans.length} plan${plans.length > 1 ? "s" : ""} actif${plans.length > 1 ? "s" : ""}`} />

      <div className="rounded-xl border bg-white shadow-sm">
        {plans.length === 0 ? (
          <EmptyState icon={Euro} title="Aucun plan de financement" description="Les plans sont créés depuis la fiche étudiant." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Étudiant</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Payé</th>
                <th className="text-right p-4">Restant</th>
                <th className="text-left p-4">Avancement</th>
                <th className="text-left p-4">Échéances</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const pct = Math.round((p.paidAmount / p.totalAmount) * 100);
                const lateCount = p.installments.filter((i) => ["LATE", "UNPAID"].includes(i.status)).length;
                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <Link href={`/students/${p.student.id}`} className="font-medium hover:underline text-primary">
                        {p.student.lastName} {p.student.firstName}
                      </Link>
                      <p className="text-xs text-slate-400">{p.student.studentCode}</p>
                    </td>
                    <td className="p-4 text-slate-600">{p.label}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                    <td className="p-4 text-right text-green-700 font-medium">{formatCurrency(p.paidAmount)}</td>
                    <td className="p-4 text-right text-slate-700">{formatCurrency(p.totalAmount - p.paidAmount)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500">{p.installments.length} échéance{p.installments.length > 1 ? "s" : ""}</span>
                      {lateCount > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">{lateCount} retard{lateCount > 1 ? "s" : ""}</Badge>
                      )}
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
