import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateBulletin } from "@/server/actions/bulletins";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FileCheck, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function BulletinsPage({
  searchParams,
}: {
  searchParams: { periodId?: string; classId?: string; status?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [periods, classes] = await Promise.all([
    prisma.bulletinPeriod.findMany({
      where: session.user.role !== "SUPER_ADMIN"
        ? { establishment: { users: { some: { userId: session.user.id } } } }
        : {},
      orderBy: { startDate: "desc" },
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const bulletins = searchParams.periodId
    ? await prisma.bulletin.findMany({
        where: {
          bulletinPeriodId: searchParams.periodId,
          ...(searchParams.classId && { student: { classId: searchParams.classId } }),
          ...(searchParams.status && { status: searchParams.status as any }),
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true, class: { select: { name: true } } } },
          bulletinPeriod: true,
          subjectLines: true,
        },
        orderBy: { student: { lastName: "asc" } },
      })
    : [];

  const selectedPeriod = periods.find((p) => p.id === searchParams.periodId);

  return (
    <div>
      <PageHeader
        title="Bulletins"
        description={selectedPeriod ? `Période : ${selectedPeriod.name}` : "Sélectionnez une période"}
      />

      {/* Filtres */}
      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <select name="periodId" defaultValue={searchParams.periodId ?? ""}
            className="text-sm border rounded-md px-2 py-1 flex-1 min-w-48">
            <option value="">Sélectionner une période…</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="classId" defaultValue={searchParams.classId ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="status" defaultValue={searchParams.status ?? ""}
            className="text-sm border rounded-md px-2 py-1">
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="VALIDATED">Validé</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
          <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
        </form>
      </div>

      {!searchParams.periodId ? (
        <EmptyState
          icon={FileCheck}
          title="Sélectionnez une période"
          description="Choisissez une période dans le filtre ci-dessus pour afficher les bulletins."
        />
      ) : bulletins.length === 0 ? (
        <div className="rounded-xl border bg-white shadow-sm p-8 text-center">
          <p className="text-slate-500 text-sm mb-4">Aucun bulletin généré pour cette sélection.</p>
          <p className="text-xs text-slate-400">
            Les bulletins sont générés individuellement depuis la fiche étudiant,<br />
            ou en masse via le bouton ci-dessous.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500 bg-slate-50">
                <th className="text-left p-4">Étudiant</th>
                <th className="text-left p-4">Classe</th>
                <th className="text-left p-4">Moyenne</th>
                <th className="text-left p-4">Absences</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <Link href={`/students/${b.student.id}`} className="font-medium hover:underline">
                      {b.student.lastName} {b.student.firstName}
                    </Link>
                    <p className="text-xs text-slate-400">{b.student.studentCode}</p>
                  </td>
                  <td className="p-4 text-slate-500">{b.student.class?.name ?? "—"}</td>
                  <td className="p-4 font-semibold">
                    {b.overallAverage !== null ? `${b.overallAverage.toFixed(2).replace(".", ",")} /20` : "—"}
                  </td>
                  <td className="p-4 text-slate-500">{b.totalAbsences ?? 0}</td>
                  <td className="p-4">
                    {b.status === "DRAFT" && <Badge variant="warning">Brouillon</Badge>}
                    {b.status === "VALIDATED" && <Badge variant="success">Validé</Badge>}
                    {b.status === "ARCHIVED" && <Badge variant="gray">Archivé</Badge>}
                  </td>
                  <td className="p-4">
                    <Link href={`/bulletins/${b.id}`} className="text-xs text-primary hover:underline mr-3">
                      Voir →
                    </Link>
                    {b.status === "DRAFT" && (
                      <form action={generateBulletin.bind(null, b.student.id, b.bulletinPeriodId) as any}
                        style={{ display: "inline" }}>
                        <button type="submit" className="text-xs text-slate-500 hover:text-slate-900">
                          <RefreshCw className="h-3.5 w-3.5 inline mr-1" />Regénérer
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
