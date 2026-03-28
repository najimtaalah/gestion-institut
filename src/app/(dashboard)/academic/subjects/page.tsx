import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSubject, deleteSubject } from "@/server/actions/academic";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen, Trash2 } from "lucide-react";

export default async function SubjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div>
      <PageHeader title="Matières" description={`${subjects.length} matière${subjects.length > 1 ? "s" : ""}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire ajout */}
        <div className="rounded-xl border bg-white p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Nouvelle matière</h2>
          <form action={createSubject as any} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" name="name" required placeholder="ex: Mathématiques" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="ex: MATH" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coefficient">Coefficient</Label>
              <Input id="coefficient" name="coefficient" type="number" min="0.1" step="0.5" defaultValue="1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">Couleur planning</Label>
              <Input id="color" name="color" type="color" defaultValue="#6366f1" className="h-9 px-2 cursor-pointer" />
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          {subjects.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState icon={BookOpen} title="Aucune matière" description="Créez votre première matière." />
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500 bg-slate-50">
                    <th className="text-left p-4">Couleur</th>
                    <th className="text-left p-4">Matière</th>
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Coefficient</th>
                    <th className="text-left p-4">Cours</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div
                          className="h-5 w-5 rounded-full"
                          style={{ backgroundColor: s.color ?? "#6366f1" }}
                        />
                      </td>
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{s.code ?? "—"}</td>
                      <td className="p-4">×{s.coefficient}</td>
                      <td className="p-4 text-slate-500">{s._count.courses}</td>
                      <td className="p-4">
                        <form action={deleteSubject.bind(null, s.id) as any}>
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={s._count.courses > 0}
                            title={s._count.courses > 0 ? "Impossible : matière utilisée dans des cours" : "Supprimer"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
