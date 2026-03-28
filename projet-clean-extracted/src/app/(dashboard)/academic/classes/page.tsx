import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClass, createGroup, deleteClass } from "@/server/actions/academic";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Trash2 } from "lucide-react";

export default async function ClassesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [classes, levels, establishments] = await Promise.all([
    prisma.class.findMany({
      include: {
        level: true,
        field: true,
        establishment: { select: { name: true } },
        groups: { include: { _count: { select: { students: true } } } },
        _count: { select: { students: true, courses: true } },
      },
      orderBy: [{ establishment: { name: "asc" } }, { level: { order: "asc" } }, { name: "asc" }],
    }),
    prisma.level.findMany({
      include: { establishment: true, fields: true },
      orderBy: { order: "asc" },
    }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Classes & Groupes" description={`${classes.length} classe${classes.length > 1 ? "s" : ""}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="rounded-xl border bg-white p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Nouvelle classe</h2>
          <form action={createClass as any} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Établissement *</Label>
              <select name="establishmentId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau *</Label>
              <select name="levelId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} — {l.establishment.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nom de la classe *</Label>
              <Input name="name" required placeholder="ex: 1ère A" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacité max</Label>
              <Input name="capacity" type="number" min="1" placeholder="30" />
            </div>
            <Button type="submit" className="w-full">Créer la classe</Button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 space-y-3">
          {classes.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState icon={Users} title="Aucune classe" description="Créez votre première classe." />
            </div>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.level.name} · {c.establishment.name}
                      {c.field && ` · ${c.field.name}`}
                      {c.capacity && ` · max ${c.capacity}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{c._count.students} étudiant{c._count.students > 1 ? "s" : ""}</span>
                    <span className="text-xs text-slate-400">{c._count.courses} cours</span>
                    <form action={deleteClass.bind(null, c.id) as any}>
                      <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        disabled={c._count.students > 0 || c._count.courses > 0}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
                {/* Groupes */}
                <div className="p-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Groupes</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.groups.length === 0 ? (
                      <span className="text-xs text-slate-400">Aucun groupe</span>
                    ) : (
                      c.groups.map((g) => (
                        <span key={g.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs">
                          {g.name} ({g._count.students})
                        </span>
                      ))
                    )}
                  </div>
                  <form action={createGroup as any} className="flex gap-2">
                    <input type="hidden" name="classId" value={c.id} />
                    <Input name="name" placeholder="Nom du groupe" className="text-xs h-7" required />
                    <Button type="submit" size="sm" variant="outline" className="h-7 text-xs shrink-0">
                      + Groupe
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
