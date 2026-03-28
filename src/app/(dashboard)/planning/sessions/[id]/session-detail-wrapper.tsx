import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSessionById } from "@/server/queries/planning";
import SessionDetailClient from "./session-detail-client";

export default async function SessionDetailWrapper({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getSessionById(params.id);
  if (!data) notFound();

  // Détermine la liste d'étudiants (groupe prioritaire sur classe)
  const students = data.course.group?.students ?? data.course.class.students ?? [];

  return (
    <SessionDetailClient
      session={data as any}
      students={students}
      currentUserId={session.user.id}
      canEdit={["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "PEDAGOGICAL_MANAGER", "TEACHER"].includes(session.user.role)}
    />
  );
}
