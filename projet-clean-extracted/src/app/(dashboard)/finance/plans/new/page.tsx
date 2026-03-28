import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createFinancingPlan } from "@/server/actions/finance";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function NewFinancePlanPage({
  searchParams,
}: {
  searchParams: { studentId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, studentCode: true },
  });

  return (
    <div className="max-w-lg">
      <PageHeader title="Nouveau plan de financement" />
      <form action={createFinancingPlan as any} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <Label>Étudiant *</Label>
          <select name="studentId" required defaultValue={searchParams.studentId ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Sélectionner…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName} {s.firstName} ({s.studentCode})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Libellé *</Label>
          <Input name="label" required placeholder="ex: Financement 2024-2025" />
        </div>
        <div className="space-y-1.5">
          <Label>Montant total (€) *</Label>
          <Input name="totalAmount" type="number" min="1" step="0.01" required placeholder="6000" />
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <textarea name="notes" rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Créer le plan</Button>
          <Link href="/finance/plans"><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
