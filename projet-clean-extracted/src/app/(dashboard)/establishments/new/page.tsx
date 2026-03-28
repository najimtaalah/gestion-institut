import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createEstablishment } from "@/server/actions/establishments";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function NewEstablishmentPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-xl">
      <PageHeader title="Nouvel établissement" />
      <form action={createEstablishment as any} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input name="name" required placeholder="Institut Lumière Paris" />
          </div>
          <div className="space-y-1.5">
            <Label>Code * (unique)</Label>
            <Input name="code" required placeholder="ILP" className="uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input name="address" />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input name="city" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input name="phone" type="tel" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
        </div>
        <input type="hidden" name="isActive" value="true" />
        <div className="flex gap-3 pt-2">
          <Button type="submit">Créer l&apos;établissement</Button>
          <Link href="/establishments"><Button type="button" variant="outline">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
