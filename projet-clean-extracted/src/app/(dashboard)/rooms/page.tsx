import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createRoom, deleteRoom } from "@/server/actions/academic";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { DoorOpen, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function RoomsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [rooms, establishments] = await Promise.all([
    prisma.room.findMany({
      include: {
        establishment: { select: { name: true, code: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: [{ establishment: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Salles" description={`${rooms.length} salle${rooms.length > 1 ? "s" : ""}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire ajout */}
        <div className="rounded-xl border bg-white p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Nouvelle salle</h2>
          <form action={createRoom as any} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Établissement *</Label>
              <select name="establishmentId" required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Sélectionner…</option>
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nom de la salle *</Label>
              <Input name="name" required placeholder="ex: Salle A101" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacité</Label>
              <Input name="capacity" type="number" min="1" placeholder="30" />
            </div>
            <div className="space-y-1.5">
              <Label>Localisation</Label>
              <Input name="location" placeholder="ex: Bâtiment A, 1er étage" />
            </div>
            <div className="space-y-1.5">
              <Label>Équipements</Label>
              <Input name="equipment" placeholder="ex: Vidéoprojecteur, tableau" />
            </div>
            <Button type="submit" className="w-full">Ajouter la salle</Button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          {rooms.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState icon={DoorOpen} title="Aucune salle" description="Ajoutez votre première salle." />
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-slate-500 bg-slate-50">
                    <th className="text-left p-4">Salle</th>
                    <th className="text-left p-4">Établissement</th>
                    <th className="text-left p-4">Localisation</th>
                    <th className="text-left p-4">Capacité</th>
                    <th className="text-left p-4">Équipements</th>
                    <th className="text-left p-4">Séances</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium">{r.name}</td>
                      <td className="p-4">
                        <Badge variant="gray" className="font-mono text-xs">{r.establishment.code}</Badge>
                      </td>
                      <td className="p-4 text-slate-500">{r.location ?? "—"}</td>
                      <td className="p-4">
                        {r.capacity ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />{r.capacity}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">{r.equipment ?? "—"}</td>
                      <td className="p-4 text-slate-500">{r._count.sessions}</td>
                      <td className="p-4">
                        <form action={deleteRoom.bind(null, r.id) as any}>
                          <Button type="submit" size="icon" variant="ghost"
                            className="h-7 w-7 text-destructive"
                            disabled={r._count.sessions > 0}
                            title={r._count.sessions > 0 ? "Salle utilisée dans des séances" : "Supprimer"}>
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
