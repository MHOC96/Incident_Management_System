"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { IncidentForm } from "@/components/incidents/IncidentForm";
import { PageContainer } from "@/components/layout/PageContainer";

function NewIncidentContent() {
  return (
    <PageContainer width="app">
      <section className="py-8 md:py-10">
        <h1 className="mb-2 text-[26px] font-semibold md:text-[32px]">Submit a complaint or suggestion</h1>
        <p className="mb-6 max-w-2xl text-text-secondary md:mb-8">
          Choose complaint or suggestion, describe the issue or idea, add location details, and
          attach optional photo or video evidence.
        </p>
        <IncidentForm />
      </section>
    </PageContainer>
  );
}

export default function NewIncidentPage() {
  return (
    <RequireAuth allowedRoles={["STUDENT", "LECTURER"]}>
      <NewIncidentContent />
    </RequireAuth>
  );
}
