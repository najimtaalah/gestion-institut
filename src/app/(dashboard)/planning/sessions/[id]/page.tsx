"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, Save, ChevronLeft } from "lucide-react";
import { saveAttendance, updateSession } from "@/server/actions/planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionStatusBadge, CourseTypeBadge, AttendanceBadge } from "@/components/shared/status-badge";
import Link from "next/link";

// ⚠️ Cette page est mixte : on la sépare en un wrapper serveur + composant client

export { default } from "./session-detail-wrapper";
