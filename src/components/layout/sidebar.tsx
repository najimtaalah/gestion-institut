"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DoorOpen,
  ClipboardList,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn, getInitials, roleLabel } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Établissements", href: "/establishments", icon: Building2, roles: ["SUPER_ADMIN"] },
  { label: "Utilisateurs", href: "/users", icon: Users, roles: ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"] },
  { label: "Étudiants", href: "/students", icon: GraduationCap },
  {
    label: "Organisation pédagogique",
    icon: BookOpen,
    children: [
      { label: "Niveaux & Filières", href: "/academic/levels" },
      { label: "Classes & Groupes", href: "/academic/classes" },
      { label: "Matières", href: "/academic/subjects" },
    ],
    roles: ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "PEDAGOGICAL_MANAGER", "LEVEL_MANAGER"],
  },
  {
    label: "Planning",
    icon: Calendar,
    children: [
      { label: "Cours", href: "/planning/courses" },
      { label: "Séances", href: "/planning/sessions" },
    ],
  },
  { label: "Salles", href: "/rooms", icon: DoorOpen, roles: ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "PEDAGOGICAL_MANAGER"] },
  {
    label: "Saisie pédagogique",
    icon: ClipboardList,
    children: [
      { label: "Présences & Retards", href: "/attendance" },
      { label: "Notes", href: "/grades" },
    ],
  },
  { label: "Bulletins", href: "/bulletins", icon: FileCheck },
  {
    label: "Finance",
    icon: BarChart3,
    children: [
      { label: "Plans de financement", href: "/finance/plans" },
      { label: "Échéanciers", href: "/finance/installments" },
      { label: "Impayés & Relances", href: "/finance/reminders" },
    ],
    roles: ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN", "FINANCIAL_MANAGER"],
  },
  { label: "Paramètres", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "ESTABLISHMENT_ADMIN"] },
];

function NavGroup({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => pathname.startsWith(c.href));
    }
    return false;
  });

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {open && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === child.href || pathname.startsWith(child.href + "/")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        pathname === item.href || pathname.startsWith(item.href! + "/")
          ? "bg-primary/10 text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ session }: { session: Session }) {
  const userRole = session.user.role;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="flex h-full flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-900">EduAdmin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavGroup key={item.label} item={item} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-md p-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {getInitials(session.user.name ?? "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{session.user.name}</p>
            <p className="text-xs text-slate-500 truncate">{roleLabel(userRole)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Déconnexion"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
