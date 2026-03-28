export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar fixe */}
      <div className="hidden md:flex md:w-56 md:flex-col md:shrink-0">
        <Sidebar session={session} />
      </div>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
