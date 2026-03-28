import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null, pattern = "dd/MM/yyyy") {
  if (!date) return "—";
  return format(new Date(date), pattern, { locale: fr });
}

export function formatDateTime(date: Date | string | null) {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatRelative(date: Date | string) {
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatScore(score: number, max: number = 20) {
  return `${score.toFixed(1).replace(".", ",")}/${max}`;
}

/** Génère un code étudiant unique : STU-YYYY-NNNNN */
export function generateStudentCode(year: number, sequence: number) {
  return `STU-${year}-${String(sequence).padStart(5, "0")}`;
}

/** Retourne le libellé court d'un rôle */
export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ESTABLISHMENT_ADMIN: "Admin Établissement",
    PEDAGOGICAL_MANAGER: "Responsable Pédago",
    LEVEL_MANAGER: "Responsable Niveau",
    FINANCIAL_MANAGER: "Gestionnaire Finance",
    TEACHER: "Professeur",
  };
  return labels[role] ?? role;
}

export function attendanceLabel(status: string) {
  const labels: Record<string, string> = {
    PRESENT: "Présent",
    ABSENT: "Absent",
    LATE: "Retard",
  };
  return labels[status] ?? status;
}

export function sessionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PLANNED: "Planifiée",
    DONE: "Réalisée",
    CANCELLED: "Annulée",
    POSTPONED: "Reportée",
  };
  return labels[status] ?? status;
}

export function installmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "À payer",
    PARTIAL: "Partiel",
    PAID: "Payé",
    LATE: "En retard",
    UNPAID: "Impayé",
  };
  return labels[status] ?? status;
}

export function courseTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PRESENTIAL: "Présentiel",
    REMOTE: "Distanciel",
    HYBRID: "Hybride",
  };
  return labels[type] ?? type;
}

export function studentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    GRADUATED: "Diplômé",
    WITHDRAWN: "Retiré",
    ARCHIVED: "Archivé",
  };
  return labels[status] ?? status;
}

export const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const DAY_LABELS_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function truncate(str: string, max = 40) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Calcule une moyenne pondérée à partir de notes */
export function weightedAverage(
  items: { score: number; coefficient: number; maxScore: number }[]
) {
  if (!items.length) return null;
  const totalWeight = items.reduce((s, i) => s + i.coefficient, 0);
  const weightedSum = items.reduce(
    (s, i) => s + (i.score / i.maxScore) * 20 * i.coefficient,
    0
  );
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}
