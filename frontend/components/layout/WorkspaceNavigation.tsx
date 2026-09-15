"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardLabel } from "@/lib/format";
import { getDashboardRoute } from "@/lib/routes";

export function WorkspaceNavigation() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const items = [
    { href: getDashboardRoute(user.role), label: getDashboardLabel(user.role) },
    ...(user.role === "STUDENT"
      ? [
          { href: "/student/incidents/new", label: "Report an incident" },
          { href: "/student/account", label: "Account" },
        ]
      : []),
    ...(user.role === "DEAN" ? [{ href: "/dean/users", label: "Official accounts" }] : []),
  ];
  return <div className="workspace-navigation"><div><span className="eyebrow">{user.role.toLowerCase()} workspace</span><span className="workspace-user">{user.name}</span></div><nav aria-label="Workspace navigation">{items.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav></div>;
}
