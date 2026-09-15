"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardLabel } from "@/lib/format";
import { getDashboardRoute } from "@/lib/routes";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try { await logout(); setOpenPath(null); }
    catch { setSignOutError("Sign out failed. Please try again."); }
    finally { setSigningOut(false); }
  }
  const menuOpen = openPath === pathname;
  const navItems = [
    ...(!isAuthenticated
      ? [
          { href: "/", label: "Home" },
          { href: "/incidents", label: "Public incidents" },
          { href: "/about", label: "About the service" },
        ]
      : [{ href: "/incidents", label: "Public incidents" }]),
    ...(isAuthenticated && user
      ? [{ href: getDashboardRoute(user.role), label: getDashboardLabel(user.role) },
        ...(user.role === "DEAN" ? [{ href: "/dean/users", label: "Official accounts" }] : []),
        ...(user.role === "STUDENT" ? [{ href: "/student/incidents/new", label: "Report an incident" }] : [])]
      : []),
  ];
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <header className="university-header" onKeyDown={event => { if (event.key === "Escape" && menuOpen) { setOpenPath(null); menuButton.current?.focus(); } }}>
      <div className="utility-bar">
        <div className="site-width portal-label">Incident Reporting & Resolution Management System</div>
      </div>
      <div className="site-width identity-row">
        <Link href="/" aria-label="University of Sri Jayewardenepura Incident Reporting home" className="university-logo">
          <Image src="/sjp-logo-large-trilingual.png" alt="University of Sri Jayewardenepura" width={436} height={83} priority />
        </Link>
        <nav aria-label="Primary navigation" className="desktop-navigation">
          {navItems.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <div className="identity-actions">
          {isAuthenticated && user ? <><NotificationBell key={user.id} onOpen={() => setOpenPath(null)} /><button disabled={signingOut} className="desktop-signin header-signout" onClick={signOut}>{signingOut ? "Signing out…" : "Sign out"}</button></> : <Link href="/login" className="desktop-signin">Sign in</Link>}
          <button ref={menuButton} type="button" className="mobile-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setOpenPath(menuOpen ? null : pathname)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
      </div>
      {menuOpen && <nav id="mobile-nav" aria-label="Mobile navigation" className="mobile-navigation">
        {navItems.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={() => setOpenPath(null)}>{item.label}</Link>)}
        {isAuthenticated ? <button disabled={signingOut} onClick={signOut}>{signingOut ? "Signing out…" : "Sign out"}</button> : <Link href="/login" onClick={() => setOpenPath(null)}>Sign in</Link>}
      </nav>}
      {signOutError && <p role="alert" className="site-width text-sm text-danger">{signOutError}</p>}
    </header>
  );
}
