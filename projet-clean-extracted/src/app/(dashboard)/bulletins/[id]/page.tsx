import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validateBulletin, updateBulletinComments, updateSubjectLineComment } from "@/server/actions/bulletins";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Printer, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function BulletinDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const bulletin = await prisma.bulletin.findUnique({
    where: { id: params.id },
    include: {
      student: { include: { class: true, level: true, establishment: true } },
      bulletinPeriod: true,
      subjectLines: { orderBy: { subjectName: "asc" } },
    },
  });

  if (!bulletin) notFound();

  const isEditable = bulletin.status === "DRAFT";
  const canValidate = ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "PEDAGOGICAL_MANAGER"].includes(session.user.role);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bulletins">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" />Retour</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            Bulletin — {bulletin.student.firstName} {bulletin.student.lastName}
          </h1>
          <p className="text-sm text-slate-500">{bulletin.bulletinPeriod.name}</p>
        </div>
        <div className="flex gap-2">
          {bulletin.status === "DRAFT" && <Badge variant="warning">Brouillon</Badge>}
          {bulletin.status === "VALIDATED" && <Badge variant="success">Validé</Badge>}
          {canValidate && bulletin.status === "DRAFT" && (
            <form action={validateBulletin.bind(null, bulletin.id)}>
              <Button type="submit" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Valider le bulletin
              </Button>
            </form>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* En-tête bulletin */}
      <div className="rounded-xl border bg-white shadow-sm p-6 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <p className="text-xs text-slate-500">Étudiant</p>
            <p className="font-semibold">{bulletin.student.lastName} {bulletin.student.firstName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Classe</p>
            <p className="font-medium">{bulletin.student.class?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Niveau</p>
            <p className="font-medium">{bulletin.student.level?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Période</p>
            <p className="font-medium">{bulletin.bulletinPeriod.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Absences</p>
            <p className="font-medium">{bulletin.totalAbsences ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Retards</p>
            <p className="font-medium">{bulletin.totalLates ?? 0}</p>
          </div>
        </div>

        {/* Moyenne générale */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {bulletin.overallAverage !== null
                ? bulletin.overallAverage.toFixed(2).replace(".", ",")
                : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">/ 20</p>
          </div>
          <div className="text-sm text-slate-600 flex-1">
            <p className="font-medium">Moyenne générale</p>
            {bulletin.rank && <p className="text-xs text-slate-500">{bulletin.rank}e / {bulletin.totalStudents}</p>}
          </div>
        </div>
      </div>

      {/* Notes par matière */}
      <div className="rounded-xl border bg-white shadow-sm mb-4">
        <div className="px-5 py-3 border-b">
          <h2 className="font-semibold text-slate-800">Résultats par matière</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500 bg-slate-50">
              <th className="text-left p-4">Matière</th>
              <th className="text-center p-4">Coeff.</th>
              <th className="text-center p-4">Moyenne</th>
              <th className="text-left p-4">Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {bulletin.subjectLines.map((line) => (
              <tr key={line.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{line.subjectName}</td>
                <td className="p-4 text-center text-slate-500">×{line.coefficient}</td>
                <td className="p-4 text-center font-semibold">
                  {line.average !== null
                    ? `${line.average.toFixed(2).replace(".", ",")} /20`
                    : "—"}
                </td>
                <td className="p-4">
                  {isEditable ? (
                    <form action={updateSubjectLineComment.bind(null, line.id, "")}>
                      <input
                        type="hidden"
                        name="lineId"
                        value={line.id}
                      />
                      <input
                        className="w-full text-xs border-b border-dashed bg-transparent focus:outline-none focus:border-primary"
                        defaultValue={line.comment ?? ""}
                        placeholder="Appréciation matière…"
                        onBlur={async (e) => {
                          // Will be handled via form
                        }}
                      />
                    </form>
                  ) : (
                    <span className="text-slate-500 text-xs">{line.comment ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appréciations générales */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Appréciations</h2>
        {isEditable ? (
          <form action={async (fd: FormData) => {
            "use server";
            await updateBulletinComments(bulletin.id, {
              generalComment: fd.get("generalComment") as string,
              teacherComment: fd.get("teacherComment") as string,
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Appréciation générale</label>
              <textarea name="generalComment" rows={3} defaultValue={bulletin.generalComment ?? ""}
                placeholder="Appréciation générale de l'étudiant pour cette période…"
                className="w-full text-sm border rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Mot du professeur principal</label>
              <textarea name="teacherComment" rows={3} defaultValue={bulletin.teacherComment ?? ""}
                placeholder="Commentaire du professeur principal…"
                className="w-full text-sm border rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <Button type="submit" size="sm">Sauvegarder les appréciations</Button>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Appréciation générale</p>
              <p className="text-slate-700">{bulletin.generalComment || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mot du professeur principal</p>
              <p className="text-slate-700">{bulletin.teacherComment || "—"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
