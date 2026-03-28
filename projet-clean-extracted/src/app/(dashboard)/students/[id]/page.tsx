import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Edit, Archive, Euro, BookOpen, UserCheck } from "lucide-react";
import { getStudentById, getStudentGrades, getStudentAttendances } from "@/server/queries/students";
import { getFinancingPlan } from "@/server/queries/finance";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentStatusBadge, InstallmentStatusBadge, AttendanceBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency, formatScore, weightedAverage } from "@/lib/utils";
import { archiveStudent } from "@/server/actions/students";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [student, grades, attendances, financingPlans] = await Promise.all([
    getStudentById(params.id),
    getStudentGrades(params.id),
    getStudentAttendances(params.id),
    getFinancingPlan(params.id),
  ]);

  if (!student) notFound();

  // Calcul stats présences
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;

  // Moyenne générale toutes matières
  const gradeItems = grades.map((g) => ({
    score: g.score,
    coefficient: g.evaluation.coefficient,
    maxScore: g.evaluation.maxScore,
  }));
  const overallAvg = weightedAverage(gradeItems);

  return (
    <div>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`${student.studentCode} · ${student.establishment.name}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/students/${student.id}/edit`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1.5" />
                Modifier
              </Button>
            </Link>
            {student.status !== "ARCHIVED" && (
              <form action={archiveStudent.bind(null, student.id) as any}>
                <Button size="sm" variant="outline" type="submit"
                  className="text-destructive hover:text-destructive">
                  <Archive className="h-4 w-4 mr-1.5" />
                  Archiver
                </Button>
              </form>
            )}
          </div>
        }
      />

      {/* Infos synthèse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Statut</p>
          <div className="mt-1"><StudentStatusBadge status={student.status} /></div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Classe</p>
          <p className="text-sm font-medium mt-1">{student.class?.name ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Absences / Retards</p>
          <p className="text-sm font-medium mt-1">{absentCount} abs. · {lateCount} ret.</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Moyenne générale</p>
          <p className="text-sm font-medium mt-1">
            {overallAvg !== null ? `${overallAvg.toFixed(2).replace(".", ",")} / 20` : "—"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="grades">Notes</TabsTrigger>
          <TabsTrigger value="attendance">Présences</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        {/* Infos */}
        <TabsContent value="info">
          <div className="rounded-xl border bg-white p-6 shadow-sm mt-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ["Email", student.email ?? "—"],
                ["Téléphone", student.phone ?? "—"],
                ["Date de naissance", formatDate(student.dateOfBirth)],
                ["Niveau", student.level?.name ?? "—"],
                ["Filière", student.field?.name ?? "—"],
                ["Groupe", student.group?.name ?? "—"],
                ["Adresse", student.address ? `${student.address}${student.city ? `, ${student.city}` : ""}` : "—"],
                ["Inscrit le", formatDate(student.enrolledAt)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {student.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 mb-1">Notes internes</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{student.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="grades">
          <div className="rounded-xl border bg-white shadow-sm mt-2">
            {grades.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Aucune note enregistrée</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500">
                    <th className="text-left p-4">Évaluation</th>
                    <th className="text-left p-4">Matière</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Note</th>
                    <th className="text-left p-4">Coeff.</th>
                    <th className="text-left p-4">Période</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium">{g.evaluation.title}</td>
                      <td className="p-4">{g.evaluation.subject.name}</td>
                      <td className="p-4 text-slate-500">{formatDate(g.evaluation.date)}</td>
                      <td className="p-4 font-semibold">
                        {g.isAbsent ? <span className="text-destructive">Abs.</span> : formatScore(g.score, g.evaluation.maxScore)}
                      </td>
                      <td className="p-4 text-slate-500">×{g.evaluation.coefficient}</td>
                      <td className="p-4 text-slate-500">{g.evaluation.period ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Présences */}
        <TabsContent value="attendance">
          <div className="rounded-xl border bg-white shadow-sm mt-2">
            {attendances.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Aucune présence enregistrée</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Matière</th>
                    <th className="text-left p-4">Statut</th>
                    <th className="text-left p-4">Retard</th>
                    <th className="text-left p-4">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">{formatDate(a.session.date)}</td>
                      <td className="p-4">{a.session.course.subject.name}</td>
                      <td className="p-4"><AttendanceBadge status={a.status} /></td>
                      <td className="p-4 text-slate-500">{a.lateMinutes ? `${a.lateMinutes} min` : "—"}</td>
                      <td className="p-4 text-slate-500 text-xs">{a.comment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance">
          <div className="mt-2 space-y-4">
            {financingPlans.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center text-slate-400 text-sm shadow-sm">
                Aucun plan de financement
                <div className="mt-2">
                  <Link href={`/finance/plans/new?studentId=${student.id}`}>
                    <Button size="sm"><Euro className="h-4 w-4 mr-1.5" />Créer un plan</Button>
                  </Link>
                </div>
              </div>
            ) : (
              financingPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border bg-white shadow-sm">
                  <div className="flex items-center justify-between p-5 border-b">
                    <div>
                      <h3 className="font-semibold">{plan.label}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatCurrency(plan.paidAmount)} payé sur {formatCurrency(plan.totalAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-32 h-2 bg-slate-100 rounded-full">
                        <div
                          className="h-2 bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (plan.paidAmount / plan.totalAmount) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.round((plan.paidAmount / plan.totalAmount) * 100)}%
                      </p>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-slate-500">
                        <th className="text-left p-4">Échéance</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Montant</th>
                        <th className="text-left p-4">Payé</th>
                        <th className="text-left p-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.installments.map((inst) => (
                        <tr key={inst.id} className="border-b hover:bg-slate-50">
                          <td className="p-4 font-medium">{inst.label}</td>
                          <td className="p-4 text-slate-500">{formatDate(inst.dueDate)}</td>
                          <td className="p-4">{formatCurrency(inst.amount)}</td>
                          <td className="p-4">{formatCurrency(inst.paidAmount)}</td>
                          <td className="p-4"><InstallmentStatusBadge status={inst.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
