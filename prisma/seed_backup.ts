import {
  PrismaClient,
  UserRole,
  StudentStatus,
  CourseType,
  SessionStatus,
  AttendanceStatus,
  EvaluationType,
  InstallmentStatus,
  BulletinPeriodStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding EduAdmin...");

  // ─── Nettoyage dans l'ordre pour respecter les FK ───
  await prisma.auditLog.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.financingPlan.deleteMany();
  await prisma.bulletinSubjectLine.deleteMany();
  await prisma.bulletin.deleteMany();
  await prisma.bulletinPeriod.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.courseAssignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.userSubjectAccess.deleteMany();
  await prisma.userClassAccess.deleteMany();
  await prisma.userLevelAccess.deleteMany();
  await prisma.userEstablishment.deleteMany();
  await prisma.group.deleteMany();
  await prisma.class.deleteMany();
  await prisma.field.deleteMany();
  await prisma.level.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.reminderRule.deleteMany();

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // ─── Utilisateurs ───────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@edu-admin.io",
      name: "Super Admin",
      passwordHash: hash("Admin123!"),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const directorParis = await prisma.user.create({
    data: {
      email: "directeur.paris@edu-admin.io",
      name: "Marie Dupont",
      passwordHash: hash("Directeur123!"),
      role: UserRole.ESTABLISHMENT_ADMIN,
      isActive: true,
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: "prof.martin@edu-admin.io",
      name: "Jean Martin",
      passwordHash: hash("Professeur123!"),
      role: UserRole.TEACHER,
      isActive: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "prof.leroy@edu-admin.io",
      name: "Sophie Leroy",
      passwordHash: hash("Professeur123!"),
      role: UserRole.TEACHER,
      isActive: true,
    },
  });

  const financialManager = await prisma.user.create({
    data: {
      email: "finance@edu-admin.io",
      name: "Pierre Moreau",
      passwordHash: hash("Finance123!"),
      role: UserRole.FINANCIAL_MANAGER,
      isActive: true,
    },
  });

  const pedaManager = await prisma.user.create({
    data: {
      email: "pedago@edu-admin.io",
      name: "Isabelle Bernard",
      passwordHash: hash("Pedago123!"),
      role: UserRole.PEDAGOGICAL_MANAGER,
      isActive: true,
    },
  });

  // ─── Établissements ─────────────────────────────────
  const estabParis = await prisma.establishment.create({
    data: {
      name: "Institut Lumière Paris",
      code: "ILP",
      address: "12 rue de la Paix",
      city: "Paris",
      phone: "01 23 45 67 89",
      email: "contact@institut-lumiere-paris.fr",
      isActive: true,
    },
  });

  const estabLyon = await prisma.establishment.create({
    data: {
      name: "Institut Lumière Lyon",
      code: "ILL",
      address: "5 place Bellecour",
      city: "Lyon",
      phone: "04 56 78 90 12",
      email: "contact@institut-lumiere-lyon.fr",
      isActive: true,
    },
  });

  // Affectations utilisateurs → établissements
  await prisma.userEstablishment.createMany({
    data: [
      { userId: directorParis.id, establishmentId: estabParis.id },
      { userId: teacher1.id, establishmentId: estabParis.id },
      { userId: teacher2.id, establishmentId: estabParis.id },
      { userId: financialManager.id, establishmentId: estabParis.id },
      { userId: financialManager.id, establishmentId: estabLyon.id },
      { userId: pedaManager.id, establishmentId: estabParis.id },
    ],
  });

  // ─── Salles ─────────────────────────────────────────
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: "Salle A101",
        capacity: 30,
        location: "Bâtiment A, 1er étage",
        equipment: "Vidéoprojecteur, tableau blanc",
        establishmentId: estabParis.id,
      },
    }),
    prisma.room.create({
      data: {
        name: "Salle A102",
        capacity: 25,
        location: "Bâtiment A, 1er étage",
        equipment: "Vidéoprojecteur",
        establishmentId: estabParis.id,
      },
    }),
    prisma.room.create({
      data: {
        name: "Amphithéâtre B",
        capacity: 80,
        location: "Bâtiment B, RDC",
        equipment: "Scène, micro, vidéoprojecteur HD",
        establishmentId: estabParis.id,
      },
    }),
  ]);

  // ─── Matières ────────────────────────────────────────
  const math = await prisma.subject.create({
    data: { name: "Mathématiques", code: "MATH", coefficient: 3, color: "#3B82F6" },
  });
  const french = await prisma.subject.create({
    data: { name: "Français", code: "FR", coefficient: 3, color: "#EF4444" },
  });
  const english = await prisma.subject.create({
    data: { name: "Anglais", code: "EN", coefficient: 2, color: "#10B981" },
  });
  const history = await prisma.subject.create({
    data: { name: "Histoire-Géographie", code: "HG", coefficient: 2, color: "#F59E0B" },
  });
  const science = await prisma.subject.create({
    data: { name: "Sciences", code: "SCI", coefficient: 2, color: "#8B5CF6" },
  });

  // ─── Niveaux ─────────────────────────────────────────
  const level1 = await prisma.level.create({
    data: { name: "Première année", order: 1, establishmentId: estabParis.id },
  });
  const level2 = await prisma.level.create({
    data: { name: "Deuxième année", order: 2, establishmentId: estabParis.id },
  });

  // ─── Filières ─────────────────────────────────────────
  const fieldGeneral = await prisma.field.create({
    data: { name: "Général", code: "GEN", levelId: level1.id },
  });
  const fieldTech = await prisma.field.create({
    data: { name: "Technologique", code: "TECH", levelId: level1.id },
  });

  // ─── Classes ─────────────────────────────────────────
  const class1A = await prisma.class.create({
    data: {
      name: "1ère A",
      capacity: 28,
      levelId: level1.id,
      fieldId: fieldGeneral.id,
      establishmentId: estabParis.id,
    },
  });
  const class1B = await prisma.class.create({
    data: {
      name: "1ère B",
      capacity: 26,
      levelId: level1.id,
      fieldId: fieldTech.id,
      establishmentId: estabParis.id,
    },
  });

  // ─── Groupes ──────────────────────────────────────────
  const group1A1 = await prisma.group.create({
    data: { name: "Groupe 1", classId: class1A.id },
  });
  const group1A2 = await prisma.group.create({
    data: { name: "Groupe 2", classId: class1A.id },
  });

  // ─── Étudiants ────────────────────────────────────────
  const studentsData = [
    {
      firstName: "Alice",
      lastName: "Durand",
      email: "alice.durand@example.com",
      phone: "06 11 22 33 44",
      dateOfBirth: new Date("2007-03-15"),
      classId: class1A.id,
      groupId: group1A1.id,
    },
    {
      firstName: "Baptiste",
      lastName: "Lefebvre",
      email: "baptiste.lefebvre@example.com",
      phone: "06 22 33 44 55",
      dateOfBirth: new Date("2007-06-22"),
      classId: class1A.id,
      groupId: group1A1.id,
    },
    {
      firstName: "Camille",
      lastName: "Petit",
      email: "camille.petit@example.com",
      dateOfBirth: new Date("2007-11-08"),
      classId: class1A.id,
      groupId: group1A2.id,
    },
    {
      firstName: "David",
      lastName: "Simon",
      email: "david.simon@example.com",
      dateOfBirth: new Date("2007-01-30"),
      classId: class1A.id,
      groupId: group1A2.id,
    },
    {
      firstName: "Emma",
      lastName: "Michel",
      email: "emma.michel@example.com",
      dateOfBirth: new Date("2007-09-12"),
      classId: class1B.id,
    },
    {
      firstName: "Félix",
      lastName: "Garcia",
      email: "felix.garcia@example.com",
      dateOfBirth: new Date("2007-04-25"),
      classId: class1B.id,
    },
  ];

  const students = await Promise.all(
    studentsData.map((s, i) =>
      prisma.student.create({
        data: {
          ...s,
          studentCode: `STU-2024-${String(i + 1).padStart(5, "0")}`,
          status: StudentStatus.ACTIVE,
          levelId: level1.id,
          fieldId: fieldGeneral.id,
          establishmentId: estabParis.id,
        },
      })
    )
  );

  // ─── Cours ────────────────────────────────────────────
  const courseMath1A = await prisma.course.create({
    data: {
      title: "Mathématiques — 1ère A",
      type: CourseType.PRESENTIAL,
      dayOfWeek: 1, // Lundi
      startTime: "08:00",
      endTime: "10:00",
      startDate: new Date("2024-09-02"),
      endDate: new Date("2025-06-30"),
      isRecurring: true,
      establishmentId: estabParis.id,
      classId: class1A.id,
      subjectId: math.id,
    },
  });

  const courseFr1A = await prisma.course.create({
    data: {
      title: "Français — 1ère A",
      type: CourseType.PRESENTIAL,
      dayOfWeek: 2, // Mardi
      startTime: "10:00",
      endTime: "12:00",
      startDate: new Date("2024-09-02"),
      endDate: new Date("2025-06-30"),
      isRecurring: true,
      establishmentId: estabParis.id,
      classId: class1A.id,
      subjectId: french.id,
    },
  });

  const courseEn1A = await prisma.course.create({
    data: {
      title: "Anglais — 1ère A (distanciel)",
      type: CourseType.REMOTE,
      dayOfWeek: 3, // Mercredi
      startTime: "14:00",
      endTime: "16:00",
      startDate: new Date("2024-09-02"),
      endDate: new Date("2025-06-30"),
      isRecurring: true,
      visioLink: "https://meet.example.com/anglais-1a",
      establishmentId: estabParis.id,
      classId: class1A.id,
      subjectId: english.id,
    },
  });

  // Affectations professeurs
  await prisma.courseAssignment.createMany({
    data: [
      { courseId: courseMath1A.id, teacherId: teacher1.id, isPrimary: true },
      { courseId: courseFr1A.id, teacherId: teacher2.id, isPrimary: true },
      { courseId: courseEn1A.id, teacherId: teacher2.id, isPrimary: true },
    ],
  });

  // ─── Séances ──────────────────────────────────────────
  const session1 = await prisma.session.create({
    data: {
      date: new Date("2024-09-09T08:00:00"),
      endTime: new Date("2024-09-09T10:00:00"),
      status: SessionStatus.DONE,
      type: CourseType.PRESENTIAL,
      notes: "Introduction aux fonctions du second degré",
      courseId: courseMath1A.id,
      roomId: rooms[0].id,
      teacherId: teacher1.id,
    },
  });

  const session2 = await prisma.session.create({
    data: {
      date: new Date("2024-09-16T08:00:00"),
      endTime: new Date("2024-09-16T10:00:00"),
      status: SessionStatus.DONE,
      type: CourseType.PRESENTIAL,
      notes: "Exercices d'application — discriminant",
      courseId: courseMath1A.id,
      roomId: rooms[0].id,
      teacherId: teacher1.id,
    },
  });

  // ─── Présences ────────────────────────────────────────
  const attendanceData = [
    // session1
    { sessionId: session1.id, studentId: students[0].id, status: AttendanceStatus.PRESENT },
    { sessionId: session1.id, studentId: students[1].id, status: AttendanceStatus.ABSENT },
    { sessionId: session1.id, studentId: students[2].id, status: AttendanceStatus.LATE, lateMinutes: 15 },
    { sessionId: session1.id, studentId: students[3].id, status: AttendanceStatus.PRESENT },
    // session2
    { sessionId: session2.id, studentId: students[0].id, status: AttendanceStatus.PRESENT },
    { sessionId: session2.id, studentId: students[1].id, status: AttendanceStatus.PRESENT },
    { sessionId: session2.id, studentId: students[2].id, status: AttendanceStatus.PRESENT },
    { sessionId: session2.id, studentId: students[3].id, status: AttendanceStatus.ABSENT },
  ];

  for (const a of attendanceData) {
    await prisma.attendance.create({
      data: { ...a, createdById: teacher1.id },
    });
  }

  // ─── Évaluations et notes ─────────────────────────────
  const eval1 = await prisma.evaluation.create({
    data: {
      title: "Contrôle 1 — Fonctions",
      type: EvaluationType.TEST,
      date: new Date("2024-09-23"),
      maxScore: 20,
      coefficient: 1,
      period: "S1",
      subjectId: math.id,
      classId: class1A.id,
    },
  });

  const eval2 = await prisma.evaluation.create({
    data: {
      title: "Examen mi-semestre",
      type: EvaluationType.EXAM,
      date: new Date("2024-10-14"),
      maxScore: 20,
      coefficient: 2,
      period: "S1",
      subjectId: math.id,
      classId: class1A.id,
    },
  });

  const gradesData = [
    { evaluationId: eval1.id, studentId: students[0].id, score: 16.5 },
    { evaluationId: eval1.id, studentId: students[1].id, score: 12.0 },
    { evaluationId: eval1.id, studentId: students[2].id, score: 14.5 },
    { evaluationId: eval1.id, studentId: students[3].id, score: 18.0 },
    { evaluationId: eval2.id, studentId: students[0].id, score: 15.0 },
    { evaluationId: eval2.id, studentId: students[1].id, score: 11.5 },
    { evaluationId: eval2.id, studentId: students[2].id, score: 13.0 },
    { evaluationId: eval2.id, studentId: students[3].id, score: 17.5 },
  ];

  for (const g of gradesData) {
    await prisma.grade.create({
      data: { ...g, createdById: teacher1.id },
    });
  }

  // ─── Période bulletin ─────────────────────────────────
  const period1 = await prisma.bulletinPeriod.create({
    data: {
      name: "Semestre 1 — 2024/2025",
      periodCode: "S1",
      academicYear: "2024-2025",
      startDate: new Date("2024-09-02"),
      endDate: new Date("2025-01-31"),
      status: BulletinPeriodStatus.OPEN,
      establishmentId: estabParis.id,
    },
  });

  // ─── Plans de financement ─────────────────────────────
  const plan1 = await prisma.financingPlan.create({
    data: {
      label: "Financement 2024-2025",
      totalAmount: 6000,
      paidAmount: 2000,
      studentId: students[0].id,
    },
  });

  const installments = await Promise.all([
    prisma.installment.create({
      data: {
        label: "Acompte à l'inscription",
        dueDate: new Date("2024-09-01"),
        amount: 1000,
        paidAmount: 1000,
        status: InstallmentStatus.PAID,
        financingPlanId: plan1.id,
      },
    }),
    prisma.installment.create({
      data: {
        label: "Échéance 1 — Octobre",
        dueDate: new Date("2024-10-01"),
        amount: 1000,
        paidAmount: 1000,
        status: InstallmentStatus.PAID,
        financingPlanId: plan1.id,
      },
    }),
    prisma.installment.create({
      data: {
        label: "Échéance 2 — Novembre",
        dueDate: new Date("2024-11-01"),
        amount: 1000,
        paidAmount: 0,
        status: InstallmentStatus.LATE,
        financingPlanId: plan1.id,
      },
    }),
    prisma.installment.create({
      data: {
        label: "Échéance 3 — Décembre",
        dueDate: new Date("2024-12-01"),
        amount: 1000,
        paidAmount: 0,
        status: InstallmentStatus.PENDING,
        financingPlanId: plan1.id,
      },
    }),
    prisma.installment.create({
      data: {
        label: "Solde — Janvier",
        dueDate: new Date("2025-01-01"),
        amount: 2000,
        paidAmount: 0,
        status: InstallmentStatus.PENDING,
        financingPlanId: plan1.id,
      },
    }),
  ]);

  // Paiements enregistrés
  await prisma.payment.createMany({
    data: [
      { installmentId: installments[0].id, amount: 1000, paidAt: new Date("2024-08-28"), method: "Virement", reference: "VIR-2024-001" },
      { installmentId: installments[1].id, amount: 1000, paidAt: new Date("2024-09-30"), method: "Chèque", reference: "CHQ-0042" },
    ],
  });

  // Relance sur l'impayé
  await prisma.reminder.create({
    data: {
      type: "MANUAL",
      channel: "EMAIL",
      sentAt: new Date("2024-11-15"),
      comment: "Premier rappel envoyé par email. En attente de réponse.",
      installmentId: installments[2].id,
      authorId: financialManager.id,
    },
  });

  // ─── Règles de relance auto ───────────────────────────
  await prisma.reminderRule.createMany({
    data: [
      {
        name: "Rappel J+3",
        daysAfterDueDate: 3,
        channel: "EMAIL",
        messageTemplate: "Rappel : votre échéance de {amount}€ était due le {dueDate}.",
        isActive: true,
        establishmentId: estabParis.id,
      },
      {
        name: "Relance J+15",
        daysAfterDueDate: 15,
        channel: "EMAIL",
        messageTemplate: "Votre paiement de {amount}€ est en retard de 15 jours.",
        isActive: true,
        establishmentId: estabParis.id,
      },
    ],
  });

  console.log("✅ Seed terminé avec succès !");
  console.log("\n📋 Comptes disponibles :");
  console.log("  Super Admin : admin@edu-admin.io / Admin123!");
  console.log("  Directeur   : directeur.paris@edu-admin.io / Directeur123!");
  console.log("  Professeur  : prof.martin@edu-admin.io / Professeur123!");
  console.log("  Finance     : finance@edu-admin.io / Finance123!");
  console.log("  Pédagogie   : pedago@edu-admin.io / Pedago123!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
