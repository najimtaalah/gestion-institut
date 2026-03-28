"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Save, ChevronLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { saveAttendance, updateSession } from "@/server/actions/planning";
import { Button } from "@/components/ui/button";
import { SessionStatusBadge, CourseTypeBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/utils";

type AttendanceRow = {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  lateMinutes?: number;
  comment?: string;
};

export default function SessionDetailClient({
  session,
  students,
  currentUserId,
  canEdit,
}: {
  session: any;
  students: any[];
  currentUserId: string;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(session.notes ?? "");
  const [incident, setIncident] = useState(session.incident ?? "");
  const [status, setStatus] = useState(session.status);

  // Init des présences : depuis les données existantes ou PRESENT par défaut
  const initAttendance = (): AttendanceRow[] =>
    students.map((s) => {
      const existing = session.attendances?.find((a: any) => a.studentId === s.id);
      return existing
        ? { studentId: s.id, status: existing.status, lateMinutes: existing.lateMinutes ?? undefined, comment: existing.comment ?? undefined }
        : { studentId: s.id, status: "PRESENT" };
    });

  const [attendances, setAttendances] = useState<AttendanceRow[]>(initAttendance);

  const setStudentStatus = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendances((prev) =>
      prev.map((a) => (a.studentId === studentId ? { ...a, status: newStatus } : a))
    );
  };

  const setLateMinutes = (studentId: string, minutes: number) => {
    setAttendances((prev) =>
      prev.map((a) => (a.studentId === studentId ? { ...a, lateMinutes: minutes } : a))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSession(session.id, { notes, incident, status });
      await saveAttendance(session.id, attendances);
      toast({ title: "Séance sauvegardée", variant: "success" });
    });
  };

  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/planning/sessions">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">
            {session.course.subject.name} — {session.course.class.name}
          </h1>
          <p className="text-sm text-slate-500">
            {formatDateTime(session.date)} → {format(new Date(session.endTime), "HH:mm")}
            {session.teacher && ` · ${session.teacher.name}`}
            {session.room && ` · ${session.room.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CourseTypeBadge type={session.type} />
          <SessionStatusBadge status={status} />
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={isPending} size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Présences */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="font-semibold text-slate-800">Présences ({students.length} étudiants)</h2>
              <div className="flex gap-2 text-xs">
                <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{presentCount} présents</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{lateCount} retards</span>
                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{absentCount} absents</span>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Aucun étudiant dans cette classe
              </div>
            ) : (
              <div className="divide-y">
                {students.map((s) => {
                  const att = attendances.find((a) => a.studentId === s.id)!;
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 text-sm font-medium">{s.lastName} {s.firstName}</div>
                      <div className="flex gap-1">
                        {(["PRESENT", "LATE", "ABSENT"] as const).map((st) => (
                          <button
                            key={st}
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(s.id, st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              att.status === st
                                ? st === "PRESENT" ? "bg-green-100 text-green-800"
                                  : st === "LATE" ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {st === "PRESENT" ? "✓ Présent" : st === "LATE" ? "⏱ Retard" : "✗ Absent"}
                          </button>
                        ))}
                      </div>
                      {att.status === "LATE" && (
                        <input
                          type="number"
                          min={1}
                          max={120}
                          placeholder="min"
                          value={att.lateMinutes ?? ""}
                          onChange={(e) => setLateMinutes(s.id, Number(e.target.value))}
                          disabled={!canEdit}
                          className="w-16 text-xs border rounded px-2 py-1"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Infos séance */}
        <div className="space-y-4">
          {/* Statut */}
          {canEdit && (
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm">Statut de la séance</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5"
              >
                <option value="PLANNED">Planifiée</option>
                <option value="DONE">Réalisée</option>
                <option value="CANCELLED">Annulée</option>
                <option value="POSTPONED">Reportée</option>
              </select>
            </div>
          )}

          {/* Notes pédagogiques */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm">Contenu dispensé</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              rows={4}
              placeholder="Résumé du cours, chapitres traités…"
              className="w-full text-sm border rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Incident */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Incident (optionnel)
            </h3>
            <textarea
              value={incident}
              onChange={(e) => setIncident(e.target.value)}
              disabled={!canEdit}
              rows={3}
              placeholder="Signalement d'incident si nécessaire…"
              className="w-full text-sm border rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Lien visio */}
          {session.visioLink && (
            <div className="rounded-xl border bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-medium text-blue-700 mb-2">Lien visioconférence</p>
              <a href={session.visioLink} target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 underline break-all">
                {session.visioLink}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
