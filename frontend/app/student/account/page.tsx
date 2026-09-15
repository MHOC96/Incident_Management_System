"use client";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/useAuth";

function StudentAccountContent() {
  const { user } = useAuth();

  return (
    <PageContainer width="app">
      <section className="py-8 md:py-10">
        <h1 className="mb-6 text-[26px] font-semibold md:mb-8 md:text-[32px]">Account</h1>

        <div className="account-page-layout">
          <div className="account-page-support space-y-6">
            <div className="border border-border bg-surface p-4 md:p-6">
              <h2 className="text-[18px] font-semibold">Your profile</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-text-muted">Name</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{user?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Username (MC number)</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{user?.mc_number ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">University email</dt>
                  <dd className="mt-0.5 break-all font-medium text-foreground">
                    {user?.email ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-border bg-background px-4 py-5 md:px-6 md:py-6">
              <h2 className="text-[18px] font-semibold">Sign-in and security</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Student accounts are issued by the university. Use your MC number to sign in.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-secondary">
                <li>Your initial password is your CPM number until you set a new one.</li>
                <li>After changing your password, use the new password on every sign-in.</li>
                <li>Do not share your password with anyone.</li>
              </ul>
            </div>
          </div>

          <div className="account-page-form">
            <ChangePasswordForm showIntro={false} />
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

export default function StudentAccountPage() {
  return (
    <RequireAuth allowedRoles={["STUDENT"]}>
      <StudentAccountContent />
    </RequireAuth>
  );
}
