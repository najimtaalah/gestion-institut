import { prisma } from "@/lib/prisma";

export async function getSessions(filters: {
  establishmentId?: string;
  classId?: string;
  teacherId?: string;
  subjectId?: string;
  from?: Date;
  to?: Date;
  status?: string;
}) {
  return prisma.session.findMany({
    where: {
      ...(filters.from && { date: { gte: filters.from } }),
      ...(filters.to && { date: { lte: filters.to } }),
      ...(filters.status && { status: filters.status as any }),
      ...(filters.teacherId && { teacherId: filters.teacherId }),
      course: {
        ...(filters.establishmentId && { establishmentId: filters.establishmentId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
      },
    },
    include: {
      course: {
        include: {
          subject: true,
          class: true,
          group: true,
        },
      },
      room: true,
      teacher: { select: { id: true, name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function getSessionById(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          subject: true,
          class: { include: { students: { where: { status: "ACTIVE" }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } } },
          group: { include: { students: { where: { status: "ACTIVE" }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } } },
        },
      },
      room: true,
      teacher: { select: { id: true, name: true } },
      attendances: {
        include: { student: true },
      },
    },
  });
}

export async function getCourses(establishmentId?: string, classId?: string) {
  return prisma.course.findMany({
    where: {
      ...(establishmentId && { establishmentId }),
      ...(classId && { classId }),
    },
    include: {
      subject: true,
      class: true,
      group: true,
      assignments: { include: { teacher: { select: { id: true, name: true } } } },
      _count: { select: { sessions: true } },
    },
    orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
  });
}

/** Vérifie les conflits de salle pour une plage horaire donnée */
export async function checkRoomConflict(
  roomId: string,
  date: Date,
  endTime: Date,
  excludeSessionId?: string
): Promise<boolean> {
  const conflict = await prisma.session.findFirst({
    where: {
      roomId,
      id: excludeSessionId ? { not: excludeSessionId } : undefined,
      status: { not: "CANCELLED" },
      date: { lt: endTime },
      endTime: { gt: date },
    },
  });
  return !!conflict;
}

/** Génère des séances pour un cours récurrent */
export async function generateSessionsForCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.isRecurring || course.dayOfWeek === null) return [];

  const end = course.endDate ?? new Date(course.startDate.getFullYear() + 1, 11, 31);
  const sessions: { date: Date; endTime: Date; courseId: string; status: "PLANNED"; type: any; visioLink: string | null }[] = [];

  const current = new Date(course.startDate);
  // Avancer jusqu'au premier jour de la semaine correspondant
  while (current.getDay() !== course.dayOfWeek) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    const [startH, startM] = course.startTime.split(":").map(Number);
    const [endH, endM] = course.endTime.split(":").map(Number);

    const sessionDate = new Date(current);
    sessionDate.setHours(startH, startM, 0, 0);

    const sessionEnd = new Date(current);
    sessionEnd.setHours(endH, endM, 0, 0);

    sessions.push({
      date: sessionDate,
      endTime: sessionEnd,
      courseId: course.id,
      status: "PLANNED",
      type: course.type,
      visioLink: course.visioLink,
    });

    current.setDate(current.getDate() + 7);
  }

  // Insérer en évitant les doublons
  await prisma.session.createMany({ data: sessions, skipDuplicates: true });
  return sessions;
}
