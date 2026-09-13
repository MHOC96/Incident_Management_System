"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatApiError } from "@/lib/errors";
import { incidentService, referenceService } from "@/services/incidents";
import type { Category, IncidentVisibility, StudentIncident } from "@/types";

type Props = {
  incident: StudentIncident;
  onUpdated: (incident: StudentIncident) => void;
};

export function StudentIncidentEditPanel({ incident, onUpdated }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: incident.title,
    description: incident.description,
    category: String(incident.category.id),
    location_name: incident.location.name,
    visibility: incident.visibility,
  });

  useEffect(() => {
    if (!isOpen || categories.length > 0) return;
    void referenceService.listCategories().then(setCategories).catch(() => {
      setError("We couldn't load the category list.");
    });
  }, [isOpen, categories.length]);

  if (incident.pending_revision) {
    return (
      <section className="rounded-lg border border-primary/25 bg-primary/5 p-4 md:p-5">
        <h2 className="text-[18px] font-semibold">Changes awaiting review</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your current incident remains active while an admin reviews the submitted changes.
        </p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const updated = await incidentService.submitChanges(incident.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: Number(form.category),
        location_name: form.location_name.trim(),
        visibility: form.visibility,
      });
      onUpdated(updated);
      setIsOpen(false);
      setSuccess(
        incident.status === "SUBMITTED" ||
          incident.status === "UNDER_REVIEW" ||
          incident.status === "REJECTED"
          ? "Your updated report was submitted for review."
          : "Your changes were submitted for admin approval.",
      );
    } catch (submitError) {
      setError(formatApiError(submitError, "We couldn't submit these changes."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setError("");
    setIsDeleting(true);
    try {
      await incidentService.delete(incident.id);
      router.replace("/student/dashboard");
    } catch (deleteError) {
      setError(formatApiError(deleteError, "We couldn't delete this report."));
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const canDelete =
    incident.status === "SUBMITTED" ||
    incident.status === "UNDER_REVIEW" ||
    incident.status === "REJECTED";

  return (
    <section className="rounded-lg border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">Update incident</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {incident.status === "SUBMITTED" || incident.status === "UNDER_REVIEW" || incident.status === "REJECTED"
              ? "Editing will resubmit this report for admin review."
              : "Approved reports keep their current details until an admin accepts your changes."}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsOpen((value) => !value)}>
          {isOpen ? "Cancel editing" : "Edit details"}
        </Button>
      </div>

      {success ? <p className="mt-4 text-sm text-success">{success}</p> : null}

      {isOpen ? (
        <form className="mt-5 space-y-4 border-t border-border pt-5" onSubmit={handleSubmit}>
          <FormField label="Incident title" htmlFor="edit-title" required>
            <Input id="edit-title" value={form.title} minLength={5} maxLength={255} required onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Category" htmlFor="edit-category" required>
              <Select id="edit-category" value={form.category} required searchable onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.length === 0 ? <option value={incident.category.id}>{incident.category.name}</option> : null}
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Location" htmlFor="edit-location" required>
              <Input id="edit-location" value={form.location_name} minLength={2} maxLength={255} required onChange={(event) => setForm({ ...form, location_name: event.target.value })} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="edit-description" required>
            <Textarea id="edit-description" value={form.description} rows={6} required onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-32 resize-y" />
          </FormField>
          <FormField label="Visibility" htmlFor="edit-visibility" required>
            <Select id="edit-visibility" value={form.visibility} required onChange={(event) => setForm({ ...form, visibility: event.target.value as IncidentVisibility })}>
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
            </Select>
          </FormField>
          {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
          <Button type="submit" isLoading={isSubmitting} loadingText="Submitting changes...">
            Submit changes for review
          </Button>
        </form>
      ) : null}

      {canDelete ? (
        <div className="mt-5 border-t border-border pt-5">
          {!confirmDelete ? (
            <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete report
            </Button>
          ) : (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
              <h3 className="text-sm font-semibold text-foreground">Delete this report permanently?</h3>
              <p className="mt-1 text-sm text-text-secondary">This action cannot be undone.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="danger" isLoading={isDeleting} loadingText="Deleting report..." onClick={() => void handleDelete()}>
                  Yes, delete report
                </Button>
                <Button type="button" variant="ghost" disabled={isDeleting} onClick={() => setConfirmDelete(false)}>
                  Keep report
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
