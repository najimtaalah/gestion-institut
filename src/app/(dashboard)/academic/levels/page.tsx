import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createLevel, createField, deleteLevel } from "@/server/actions/academic";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen, ChevronRight, Trash2 } from "lucide-react";

export default async function LevelsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [levels, establishments] = await Promise.all([
    prisma.level.findMany({
      include: {
        establishment: { select: { id: true, name: true } },
        fields: true,
        _count: { select: { classes: true, students: true } },
      },
      orderBy: [{ establishment: { name: "asc" } }, { order: "asc" }],
    }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Niveaux & Filières" description={`${levels.length} niveau${levels.length > 1 ? "x" : ""}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire ajout niveau */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Nouveau niveau</h2>
            <form action={createLevel as any} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Établissement *</Label>
                <select name="establishmentId" required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Sélectionner…</option>
                  {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Nom du niveau *</Label>
                <Input name="name" required placeholder="ex: Première année" />
              </div>
              <div className="space-y-1.5">
                <Label>Ordre d&apos;affichage</Label>
                <Input name="order" type="number" defaultValue="1" min="1" />
              </div>
              <Button type="submit" className="w-full">Créer le niveau</Button>
            </form>
          </div>
        </div>

        {/* Liste niveaux */}
        <div className="lg:col-span-2">
          {levels.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState icon={BookOpen} title="Aucun niveau" description="Créez votre premier niveau." />
            </div>
          ) : (
            <div className="space-y-3">
              {levels.map((level) => (
                <div key={level.id} className="rounded-xl border bg-white shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3 border-b">
                    <div>
                      <p className="font-semibold text-slate-800">{level.name}</p>
                      <p className="text-xs text-slate-500">{level.establishment.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{level._count.classes} classe{level._count.classes > 1 ? "s" : ""}</span>
                      <span className="text-xs text-slate-400">{level._count.students} étudiant{level._count.students > 1 ? "s" : ""}</span>
                      <form action={deleteLevel.bind(null, level.id) as any}>
                        <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          disabled={level._count.classes > 0 || level._count.students > 0}
                          title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Filières */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Filières</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {level.fields.length === 0 ? (
                        <span className="text-xs text-slate-400">Aucune filière</span>
                      ) : (
                        level.fields.map((f) => (
                          <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                            {f.name}
                            {f.code && <span className="opacity-60">({f.code})</span>}
                          </span>
                        ))
                      )}
                    </div>
                    {/* Mini formulaire filière */}
                    <form action={createField as any} className="flex gap-2">
                      <input type="hidden" name="levelId" value={level.id} />
                      <Input name="name" placeholder="Nom filière" className="text-xs h-7" required />
                      <Input name="code" placeholder="Code" className="text-xs h-7 w-20" />
                      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs shrink-0">
                        + Ajouter
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
