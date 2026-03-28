import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toggleUserActive } from "@/server/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getInitials, roleLabel } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: {
      establishments: { include: { establishment: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description={`${users.length} compte${users.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/users/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvel utilisateur</Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white shadow-sm">
        {users.length === 0 ? (
          <EmptyState icon={Users} title="Aucun utilisateur" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Établissements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{roleLabel(u.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.establishments.length === 0 ? (
                        <span className="text-xs text-slate-400">Tous</span>
                      ) : (
                        u.establishments.map((ue) => (
                          <Badge key={ue.establishment.id} variant="gray" className="text-xs">
                            {ue.establishment.code}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.isActive
                      ? <Badge variant="success">Actif</Badge>
                      : <Badge variant="gray">Inactif</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${u.id}/edit`}>
                        <Button size="sm" variant="outline">Modifier</Button>
                      </Link>
                      {u.id !== session.user.id && (
                        <form action={toggleUserActive.bind(null, u.id, !u.isActive) as any}>
                          <Button size="sm" variant="ghost" type="submit"
                            className={u.isActive ? "text-amber-600" : "text-green-600"}>
                            {u.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
