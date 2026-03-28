import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const [rules, establishments] = await Promise.all([
    prisma.reminderRule.findMany({ orderBy: { daysAfterDueDate: "asc" } }),
    prisma.establishment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Paramètres" />

      {/* Règles de relance auto */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Bell className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-slate-800">Règles de relance automatique</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            Les relances automatiques sont déclenchées lorsqu'une échéance dépasse la date limite de X jours.
          </p>
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    Déclenchée J+{r.daysAfterDueDate} · Canal : {r.channel}
                    {r.establishmentId && ` · Établissement spécifique`}
                  </p>
                </div>
                <Badge variant={r.isActive ? "success" : "gray"}>
                  {r.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
            ))}
          </div>

          {/* Formulaire ajout règle */}
          <form
            action={async (fd: FormData) => {
              "use server";
              const { prisma: db } = await import("@/lib/prisma");
              await db.reminderRule.create({
                data: {
                  name: fd.get("name") as string,
                  daysAfterDueDate: parseInt(fd.get("daysAfterDueDate") as string),
                  channel: fd.get("channel") as any,
                  isActive: true,
                  establishmentId: (fd.get("establishmentId") as string) || null,
                },
              });
              const { revalidatePath } = await import("next/cache");
              revalidatePath("/settings");
            }}
            className="space-y-3 pt-3 border-t"
          >
            <p className="text-xs font-medium text-slate-700">Nouvelle règle</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nom</Label>
                <Input name="name" required placeholder="Relance J+7" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Délai (jours)</Label>
                <Input name="daysAfterDueDate" type="number" min="1" required className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Canal</Label>
                <select name="channel"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PHONE">Téléphone</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Établissement (optionnel)</Label>
              <select name="establishmentId"
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Tous les établissements</option>
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <Button type="submit" size="sm">Ajouter la règle</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
