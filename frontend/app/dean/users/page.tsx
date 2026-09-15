"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountStatusBadge } from "@/components/users/AccountStatusBadge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatApiError } from "@/lib/errors";
import { placeholders } from "@/lib/placeholders";
import { formatDate, getPositionLabel } from "@/lib/format";
import { officialService } from "@/services/officials";
import type { OfficialAccount, OfficialPosition } from "@/types";

const positions: OfficialPosition[] = [
  "VICE_CHANCELLOR",
  "HOD",
  "MAINTENANCE_OFFICER",
  "SECURITY_OFFICER",
  "OTHER",
];

type OfficialFormState = {
  name: string;
  email: string;
  position: OfficialPosition | "";
};

const emptyForm: OfficialFormState = {
  name: "",
  email: "",
  position: "",
};

type PageView = "list" | "create";

function DeanUsersContent() {
  const [view, setView] = useState<PageView>("list");
  const [officials, setOfficials] = useState<OfficialAccount[]>([]);
  const [form, setForm] = useState<OfficialFormState>(emptyForm);
  const [error, setError] = useState("");
  const [listNotice, setListNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadOfficials() {
    const data = await officialService.list();
    setOfficials(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadOfficials();
      } catch {
        setError("We couldn't load official accounts.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function openCreateView() {
    setError("");
    setForm(emptyForm);
    setView("create");
  }

  function backToList() {
    setError("");
    setForm(emptyForm);
    setView("list");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.position) {
      setError("Select a position for the official account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await officialService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        position: form.position,
      });
      setListNotice(
        `Invitation sent to ${form.email.trim()}. They can activate their account from the email link.`,
      );
      setForm(emptyForm);
      setView("list");
      await loadOfficials();
    } catch (submitError) {
      setError(formatApiError(submitError, "We couldn't create the official account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(official: OfficialAccount) {
    const nextStatus = official.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setListNotice("");
    try {
      await officialService.updateStatus(official.id, nextStatus);
      await loadOfficials();
      setListNotice(
        nextStatus === "ACTIVE"
          ? `${official.name} can sign in again.`
          : `${official.name} has been deactivated.`,
      );
    } catch {
      setError("We couldn't update official status.");
    }
  }

  if (view === "create") {
    return (
      <section className="py-6 md:py-10">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-dark"
        >
          ← Back to officials
        </button>

        <h1 className="mt-3 text-[26px] font-semibold md:text-[32px]">Invite an official</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary md:text-base">
          Add a university official who can be assigned incidents. They will receive an email to
          set their own password — you never need to share one.
        </p>

        <div className="account-page-layout mt-6 md:mt-8">
          <form
            id="create-official-form"
            onSubmit={handleSubmit}
            className="account-page-form border border-border bg-surface p-4 md:p-6"
          >
            <h2 className="text-[18px] font-semibold">Official details</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Use the official&apos;s university email address so the invitation reaches them
              reliably.
            </p>

            <div className="mt-5 space-y-4">
              <FormField label="Full name" htmlFor="name" required>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder={placeholders.fullName}
                  required
                  autoComplete="name"
                />
              </FormField>

              <FormField label="Official email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder={placeholders.officialEmail}
                  required
                  autoComplete="email"
                />
              </FormField>

              <FormField label="Position" htmlFor="position" required>
                <Select
                  id="position"
                  value={form.position}
                  onChange={(event) =>
                    setForm({ ...form, position: event.target.value as OfficialPosition | "" })
                  }
                  required
                  searchPlaceholder="Search positions..."
                >
                  <option value="">Select position</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {getPositionLabel(position)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={backToList}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                isLoading={isSubmitting}
                loadingText="Sending invitation..."
              >
                Send invitation
              </Button>
            </div>
          </form>

          <aside className="account-page-support space-y-4">
            <div className="border border-border bg-background p-4 md:p-6">
              <h2 className="text-[18px] font-semibold">What happens next</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-text-secondary">
                <li>We create the account and send an activation email.</li>
                <li>The official opens the link and chooses a password.</li>
                <li>After activation, you can assign incidents to them from the dashboard.</li>
              </ol>
            </div>
            <div className="border border-border bg-surface px-4 py-4 text-sm text-text-secondary md:px-6">
              <p className="font-medium text-foreground">Managing access later</p>
              <p className="mt-2">
                From the officials list you can deactivate or reactivate accounts. Historical
                incident assignments stay on record.
              </p>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-10">
      <Link
        href="/dean/dashboard"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-dark"
      >
        ← Back to overview
      </Link>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold md:text-[32px]">Official accounts</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isLoading
              ? "Loading officials…"
              : `${officials.length} ${officials.length === 1 ? "account" : "accounts"}`}
          </p>
        </div>
        <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={openCreateView}>
          Invite official
        </Button>
      </div>

      {listNotice ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-success/30 bg-success/5 px-3 py-2.5 text-sm text-success"
        >
          {listNotice}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="official-list incident-table mt-5 min-w-0 border border-border bg-surface md:mt-6">
        {isLoading ? (
          <div className="animate-pulse px-4 py-10 md:px-6">
            <div className="h-4 w-1/3 rounded-sm bg-border" />
            <div className="mt-4 h-4 w-2/3 rounded-sm bg-border" />
          </div>
        ) : officials.length === 0 ? (
          <div className="px-4 py-10 text-center md:px-6 md:py-14">
            <p className="font-medium text-foreground">No officials invited yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
              Invite maintenance, security, or department officials so you can assign verified
              incidents to them.
            </p>
            <Button type="button" className="mt-6 w-full sm:w-auto" onClick={openCreateView}>
              Invite your first official
            </Button>
          </div>
        ) : (
          <>
            <div className="incident-table-records divide-y divide-border">
              {officials.map((official) => (
                <div key={official.id} className="px-4 py-4">
                  <p className="font-medium">{official.name}</p>
                  <p className="text-sm text-text-muted">{official.email}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {getPositionLabel(official.position)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <AccountStatusBadge status={official.status} />
                    <span className="text-xs text-text-muted">
                      Added {formatDate(official.created_at)}
                    </span>
                  </div>
                  <div className="mt-3">
                    {official.status !== "INVITED" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full px-3 sm:w-auto"
                        onClick={() => void toggleStatus(official)}
                      >
                        {official.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                      </Button>
                    ) : (
                      <span className="text-sm text-text-muted">Waiting for activation</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="incident-table-grid">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border text-text-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium">Official</th>
                    <th className="px-6 py-3 font-medium">Position</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Added</th>
                    <th className="px-6 py-3 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {officials.map((official) => (
                    <tr key={official.id} className="border-b border-border last:border-b-0">
                      <td className="px-6 py-4">
                        <p className="font-medium">{official.name}</p>
                        <p className="text-text-muted">{official.email}</p>
                      </td>
                      <td className="px-6 py-4">{getPositionLabel(official.position)}</td>
                      <td className="px-6 py-4">
                        <AccountStatusBadge status={official.status} />
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {formatDate(official.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {official.status !== "INVITED" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-3"
                            onClick={() => void toggleStatus(official)}
                          >
                            {official.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          </Button>
                        ) : (
                          <span className="text-sm text-text-muted">Waiting for activation</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function DeanUsersPage() {
  return (
    <RequireAuth allowedRoles={["DEAN"]}>
      <PageContainer width="app">
        <DeanUsersContent />
      </PageContainer>
    </RequireAuth>
  );
}
