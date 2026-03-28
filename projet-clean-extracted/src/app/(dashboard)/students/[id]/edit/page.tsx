import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/server/actions/students";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [student, establishments, levels, classes] = await Promise.all([
    prisma.student.findUnique({ where: { id: params.id } }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.level.findMany({ include: { establishment: true }, orderBy: { order: "asc" } }),
    prisma.class.findMany({ include: { level: true }, orderBy: { name: "asc" } }),
  ]);
  if (!student) notFound();

  const action = updateStudent.bind(null, params.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Modifier — ${student.firstName} ${student.lastName}`} />
      <form action={action as any} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input name="firstName" required defaultValue={student.firstName} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input name="lastName" required defaultValue={student.lastName} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={student.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input name="phone" defaultValue={student.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date de naissance</Label>
              <Input name="dateOfBirth" type="date"
                defaultValue={student.dateOfBirth ? student.dateOfBirth.toISOString().split("T")[0] : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input name="city" defaultValue={student.city ?? ""} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Scolarité</h2>
          <div className="space-y-1.5">
            <Label>Établissement *</Label>
            <select name="establishmentId" required
              defaultValue={student.establishmentId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Niveau</Label>
              <select name="levelId" defaultValue={student.levelId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">—</option>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Classe</Label>
              <select name="classId" defaultValue={student.classId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">—</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes internes</Label>
            <textarea name="notes" rows={3} defaultValue={student.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Enregistrer</Button>
          <Link href={`/students/${params.id}`}><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
