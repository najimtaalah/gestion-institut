import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Download } from "lucide-react";
import { getStudents } from "@/server/queries/students";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; classId?: string; levelId?: string; page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const page = Number(searchParams.page ?? 1);
  const filters = {
    search: searchParams.search,
    status: searchParams.status as any,
    classId: searchParams.classId,
    levelId: searchParams.levelId,
  };

  const [{ students, total, pages }, establishments] = await Promise.all([
    getStudents(filters, page),
    prisma.establishment.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Étudiants"
        description={`${total} étudiant${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}`}
        actions={
          <Link href="/students/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvel étudiant
            </Button>
          </Link>
        }
      />

      {/* Filtres */}
      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <form className="flex flex-wrap gap-3" method="get">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              name="search"
              defaultValue={searchParams.search}
              placeholder="Nom, email, code étudiant…"
              className="text-sm flex-1 outline-none placeholder:text-slate-400"
            />
          </div>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="GRADUATED">Diplômé</option>
            <option value="WITHDRAWN">Retiré</option>
          </select>
          <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
          {Object.values(searchParams).some(Boolean) && (
            <Link href="/students"><Button size="sm" variant="ghost">Réinitialiser</Button></Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        {students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Aucun étudiant trouvé"
            description="Ajoutez votre premier étudiant ou modifiez les filtres."
            action={<Link href="/students/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvel étudiant</Button></Link>}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Établissement</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{s.studentCode}</TableCell>
                    <TableCell className="font-medium">{s.lastName} {s.firstName}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{s.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{s.establishment.name}</TableCell>
                    <TableCell className="text-sm">{s.class?.name ?? "—"}</TableCell>
                    <TableCell><StudentStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(s.enrolledAt)}</TableCell>
                    <TableCell>
                      <Link href={`/students/${s.id}`} className="text-xs text-primary hover:underline">
                        Voir →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-xs text-slate-500">Page {page} sur {pages}</p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`?page=${page - 1}`}><Button size="sm" variant="outline">← Précédent</Button></Link>
                  )}
                  {page < pages && (
                    <Link href={`?page=${page + 1}`}><Button size="sm" variant="outline">Suivant →</Button></Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
