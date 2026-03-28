import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveGrades } from "@/server/actions/grades";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function GradeEntryPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      grades: { include: { student: true } },
    },
  });
  if (!evaluation) notFound();

  // Étudiants de la classe liée à cette évaluation
  const students = evaluation.classId
    ? await prisma.student.findMany({
        where: { classId: evaluation.classId, status: "ACTIVE" },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      })
    : [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/grades">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" />Retour</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{evaluation.title}</h1>
          <p className="text-sm text-slate-500">
            {evaluation.subject.name} · {formatDate(evaluation.date)} · /{evaluation.maxScore} · ×{evaluation.coefficient}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="px-5 py-3 border-b">
          <p className="text-sm font-medium text-slate-700">
            Saisie des notes ({students.length} étudiant{students.length > 1 ? "s" : ""})
          </p>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun étudiant actif dans la classe associée.
          </div>
        ) : (
          <form
            action={async (fd: FormData) => {
              "use server";
              const { saveGrades: sg } = await import("@/server/actions/grades");
              const grades = students.map((s: any) => ({
                studentId: s.id,
                score: parseFloat(fd.get(`score_${s.id}`) as string) || 0,
                comment: (fd.get(`comment_${s.id}`) as string) || undefined,
                isAbsent: fd.get(`absent_${s.id}`) === "on",
              }));
              await sg(evaluation.id, grades);
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500 bg-slate-50">
                  <th className="text-left p-4">Étudiant</th>
                  <th className="text-center p-4">Note /{evaluation.maxScore}</th>
                  <th className="text-center p-4">Absent</th>
                  <th className="text-left p-4">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const existingGrade = evaluation.grades.find((g) => g.studentId === s.id);
                  return (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium">{s.lastName} {s.firstName}</td>
                      <td className="p-4">
                        <input
                          name={`score_${s.id}`}
                          type="number"
                          min="0"
                          max={evaluation.maxScore}
                          step="0.5"
                          defaultValue={existingGrade?.score ?? ""}
                          placeholder="—"
                          className="w-20 text-center border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          name={`absent_${s.id}`}
                          type="checkbox"
                          defaultChecked={existingGrade?.isAbsent ?? false}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          name={`comment_${s.id}`}
                          type="text"
                          defaultValue={existingGrade?.comment ?? ""}
                          placeholder="Appréciation…"
                          className="w-full border-b border-dashed bg-transparent text-sm focus:outline-none focus:border-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Button type="submit">Enregistrer les notes</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
