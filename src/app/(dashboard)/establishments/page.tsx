import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toggleEstablishment } from "@/server/actions/establishments";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export default async function EstablishmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const establishments = await prisma.establishment.findMany({
    include: {
      _count: { select: { students: true, levels: true, classes: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Établissements"
        description={`${establishments.length} établissement${establishments.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/establishments/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvel établissement
            </Button>
          </Link>
        }
      />

      {establishments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun établissement"
          description="Créez votre premier établissement."
          action={<Link href="/establishments/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Créer</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {establishments.map((e) => (
            <div key={e.id} className="rounded-xl border bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{e.name}</h3>
                    <Badge variant="gray" className="font-mono text-xs">{e.code}</Badge>
                    {e.isActive
                      ? <Badge variant="success">Actif</Badge>
                      : <Badge variant="gray">Inactif</Badge>
                    }
                  </div>
                  {e.city && <p className="text-sm text-slate-500 mt-0.5">{e.city}</p>}
                  {e.email && <p className="text-xs text-slate-400 mt-0.5">{e.email}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/establishments/${e.id}/edit`}>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </Link>
                  <form action={toggleEstablishment.bind(null, e.id, !e.isActive) as any}>
                    <Button size="sm" variant="ghost" type="submit"
                      className={e.isActive ? "text-amber-600" : "text-green-600"}>
                      {e.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  ["Niveaux", e._count.levels],
                  ["Classes", e._count.classes],
                  ["Étudiants", e._count.students],
                  ["Utilisateurs", e._count.users],
                ].map(([label, count]) => (
                  <div key={label as string} className="rounded-lg bg-slate-50 p-2">
                    <p className="text-lg font-bold text-slate-800">{count}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
