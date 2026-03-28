import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateEstablishment } from "@/server/actions/establishments";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function EditEstablishmentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const estab = await prisma.establishment.findUnique({ where: { id: params.id } });
  if (!estab) notFound();

  const action = updateEstablishment.bind(null, params.id);

  return (
    <div className="max-w-xl">
      <PageHeader title={`Modifier — ${estab.name}`} />
      <form action={action as any} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input name="name" required defaultValue={estab.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Code *</Label>
            <Input name="code" required defaultValue={estab.code} className="uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input name="address" defaultValue={estab.address ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input name="city" defaultValue={estab.city ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input name="phone" type="tel" defaultValue={estab.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={estab.email ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Statut</Label>
          <select
            name="isActive"
            defaultValue={estab.isActive ? "true" : "false"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Notes internes</Label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={estab.notes ?? ""}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Enregistrer</Button>
          <Link href="/establishments">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
