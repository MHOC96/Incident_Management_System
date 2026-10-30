"use client";

import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardRoute } from "@/lib/routes";
import { LinkButton } from "@/components/ui/LinkButton";

export function HomeIntroActions() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href={getDashboardRoute(user.role)}>
          Go to dashboard
          <ArrowRight size={18} className="ml-3" aria-hidden="true" />
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <LinkButton href="/login">
        Sign in
        <ArrowRight size={18} className="ml-3" aria-hidden="true" />
      </LinkButton>
      <LinkButton href="/about" variant="secondary">
        About this service
      </LinkButton>
    </div>
  );
}
