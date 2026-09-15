"use client";

import { FormEvent, useRef, useState } from "react";
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

function isEditableStatus(status: StudentIncident["status"]): boolean {
  return status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "REJECTED";
}

export function StudentIncidentEditPanel({ incident, onUpdated }: Props) {
  const router = useRouter();
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: incident.title,
    description: incident.description,
    category: String(incident.category.id),
    location_name: incident.location.name,
    visibility: incident.visibility,
  });

  if (incident.has_pending_changes) {
    return (
      <span className="inline-flex items-center rounded-sm border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
        With admin for review
      </span>
    );
  }

  const canDelete = isEditableStatus(incident.status);

  function openEdit() {
    setError("");
    setSuccess("");
    setForm({
      title: incident.title,
      description: incident.description,
      category: String(incident.category.id),
      location_name: incident.location.name,
      visibility: incident.visibility,
    });
    if (categories.length === 0) {
      void referenceService
        .listCategories()
        .then(setCategories)
        .catch(() => setError("We couldn't load the category list."));
    }
    editRef.current?.showModal();
  }

  function openDelete() {
    setError("");
    deleteRef.current?.showModal();
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
      setSuccess(
        isEditableStatus(incident.status)
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
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="px-4"
        onClick={openEdit}
      >
        Edit details
      </Button>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          className="px-3 text-danger hover:text-danger"
          onClick={openDelete}
        >
          Delete
        </Button>
      ) : null}

      {/* Edit dialog */}
      <dialog
        ref={editRef}
        aria-label="Edit incident report"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-md border border-border bg-surface p-0 backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === event.currentTarget) editRef.current?.close();
        }}
      >
        <div className="max-h-[86dvh] overflow-auto p-4 md:p-6">
          {success ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold">Changes submitted</h2>
              <p className="mt-2 text-sm text-text-secondary">{success}</p>
              <Button
                type="button"
                className="mt-5"
                onClick={() => editRef.current?.close()}
              >
                Done
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Edit report</h2>
                <button
                  type="button"
                  onClick={() => editRef.current?.close()}
                  className="min-h-9 rounded-sm border border-border px-3 text-sm font-medium"
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                {isEditableStatus(incident.status)
                  ? "Editing will resubmit this report for admin review."
                  : "Approved reports keep their current details until an admin accepts your changes."}
              </p>

              <FormField label="Incident title" htmlFor="edit-title" required>
                <Input
                  id="edit-title"
                  value={form.title}
                  minLength={5}
                  maxLength={255}
                  required
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Category" htmlFor="edit-category" required>
                  <Select
                    id="edit-category"
                    value={form.category}
                    required
                    searchable
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                  >
                    {categories.length === 0 ? (
                      <option value={incident.category.id}>{incident.category.name}</option>
                    ) : null}
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Location" htmlFor="edit-location" required>
                  <Input
                    id="edit-location"
                    value={form.location_name}
                    minLength={2}
                    maxLength={255}
                    required
                    onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                  />
                </FormField>
              </div>
              <FormField label="Description" htmlFor="edit-description" required>
                <Textarea
                  id="edit-description"
                  value={form.description}
                  rows={6}
                  required
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="min-h-32 resize-y"
                />
              </FormField>
              <FormField label="Visibility" htmlFor="edit-visibility" required>
                <Select
                  id="edit-visibility"
                  value={form.visibility}
                  required
                  onChange={(event) =>
                    setForm({ ...form, visibility: event.target.value as IncidentVisibility })
                  }
                >
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                  <option value="RESTRICTED">Restricted</option>
                </Select>
              </FormField>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editRef.current?.close()}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} loadingText="Submitting changes...">
                  Submit changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>

      {/* Delete confirmation dialog */}
      <dialog
        ref={deleteRef}
        aria-label="Delete incident report"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-md border border-border bg-surface p-0 backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === event.currentTarget) deleteRef.current?.close();
        }}
      >
        <div className="p-4 md:p-5">
          <h2 className="text-base font-semibold text-foreground">Delete this report?</h2>
          <p className="mt-1 text-sm text-text-secondary">This action cannot be undone.</p>
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeleting}
              onClick={() => deleteRef.current?.close()}
            >
              Keep report
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              loadingText="Deleting..."
              onClick={() => void handleDelete()}
            >
              Yes, delete
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
