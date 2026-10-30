import type { UserRole } from "@/types";

export const dashboardRoutes: Record<UserRole, string> = {
  STUDENT: "/student/dashboard",
  LECTURER: "/lecturer/dashboard",
  ADMIN: "/admin/dashboard",
  AUTHORITY: "/authority/dashboard",
  MANAGEMENT: "/management/dashboard",
  SYSADMIN: "/management/users",
};

export function getDashboardRoute(role: UserRole): string {
  return dashboardRoutes[role];
}

export const publicRoutes = ["/", "/about", "/login", "/incidents"];

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
