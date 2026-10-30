"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ImageUpload } from "@/components/incidents/ImageUpload";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatApiError, getFieldErrors } from "@/lib/errors";
import { placeholders } from "@/lib/placeholders";
import { incidentService, referenceService } from "@/services/incidents";
import type { CaseType, Category, IncidentVisibility, ReporterPriority } from "@/types";

export function IncidentForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<"creating" | "uploading" | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    case_type: "COMPLAINT" as CaseType,
    reporter_priority: "NORMAL" as ReporterPriority,
    visibility: "PRIVATE" as IncidentVisibility,
  });

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const categoryData = await referenceService.listCategories(controller.signal);
        if (!controller.signal.aborted) {
          setCategories(categoryData);
        }
      } catch {
        if (!controller.signal.aborted) {
          setFormError("We couldn't load form options. Please refresh and try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOptions(false);
        }
      }
    })();
    return () => controller.abort();
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setErrors({});
    setIsSubmitting(true);
    setSubmittingPhase("creating");

    if (!form.location.trim()) {
      setErrors((current) => ({
        ...current,
        location: "Please enter a location.",
      }));
      setIsSubmitting(false);
      setSubmittingPhase(null);
      return;
    }

    if (form.location.trim().length < 2) {
      setErrors((current) => ({
        ...current,
        location: "Location must be at least 2 characters.",
      }));
      setIsSubmitting(false);
      setSubmittingPhase(null);
      return;
    }

    if (!declarationConfirmed) {
      setErrors((current) => ({
        ...current,
        declaration: "You must confirm the declaration before submitting.",
      }));
      setIsSubmitting(false);
      setSubmittingPhase(null);
      return;
    }

    try {
      const incident = await incidentService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        category: Number(form.category),
        location_name: form.location.trim(),
        case_type: form.case_type,
        reporter_priority: form.reporter_priority,
        visibility: form.visibility,
      });

      if (evidenceFile) {
        setSubmittingPhase("uploading");
        try {
          await incidentService.uploadEvidence(incident.id, evidenceFile);
        } catch {
          router.push(`/student/incidents/${incident.id}?submitted=1&uploadFailed=1`);
          return;
        }
      }

      router.push(`/student/incidents/${incident.id}?submitted=1`);
    } catch (error) {
      setFormError(formatApiError(error, "We couldn't submit your case. Please try again."));
      setErrors(getFieldErrors(error));
      setIsSubmitting(false);
      setSubmittingPhase(null);
    }
  }

  if (isLoadingOptions) {
    return <p className="text-sm text-text-secondary">Loading form...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-8">
        <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-1 text-[18px] font-semibold">Case details</h2>
          <p className="mb-5 text-sm text-text-muted">
            Describe your complaint or suggestion clearly so staff can assess it.
          </p>

          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <FormField label="Type" htmlFor="case_type" required error={errors.case_type}>
              <Select
                id="case_type"
                value={form.case_type}
                onChange={(event) => updateField("case_type", event.target.value)}
                hasError={Boolean(errors.case_type)}
                required
              >
                <option value="COMPLAINT">Complaint</option>
                <option value="SUGGESTION">Suggestion</option>
              </Select>
            </FormField>
            <FormField
              label="Urgency"
              htmlFor="reporter_priority"
              required
              error={errors.reporter_priority}
            >
              <Select
                id="reporter_priority"
                value={form.reporter_priority}
                onChange={(event) => updateField("reporter_priority", event.target.value)}
                hasError={Boolean(errors.reporter_priority)}
                required
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Title" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={placeholders.incidentTitle}
              hasError={Boolean(errors.title)}
              required
            />
          </FormField>

          <div className="mt-4 grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
            <FormField label="Category" htmlFor="category" required error={errors.category}>
              <Select
                id="category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                hasError={Boolean(errors.category)}
                required
                searchable
                searchPlaceholder="Search categories..."
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Location" htmlFor="location" required error={errors.location}>
              <Input
                id="location"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder={placeholders.location}
                hasError={Boolean(errors.location)}
                required
              />
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="description"
            required
            error={errors.description}
            hint="Include what happened, when you noticed it, and any safety concerns."
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={6}
              required
              placeholder={placeholders.incidentDescription}
              hasError={Boolean(errors.description)}
              className="min-h-32 resize-y md:min-h-48"
            />
          </FormField>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
            <h2 className="mb-1 text-[18px] font-semibold">Evidence</h2>
            <p className="mb-5 text-sm text-text-muted">
              Optional. A photo or short video helps staff understand the issue.
            </p>
            <ImageUpload
              file={evidenceFile}
              onChange={setEvidenceFile}
              error={errors.file ?? errors.image}
            />
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
            <fieldset className="border-0 p-0">
              <legend className="mb-1 text-[18px] font-semibold">Visibility</legend>
              <p className="mb-4 text-sm text-text-muted">
                Choose who can see this report after review.
              </p>
              <div className="grid gap-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                    form.visibility === "PRIVATE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={form.visibility === "PRIVATE"}
                    onChange={(event) => updateField("visibility", event.target.value)}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="font-medium text-foreground">Private</span>
                    <span className="mt-0.5 block text-text-secondary">
                      Visible only to authorized university staff.
                    </span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                    form.visibility === "PUBLIC"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={form.visibility === "PUBLIC"}
                    onChange={(event) => updateField("visibility", event.target.value)}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="font-medium text-foreground">Public</span>
                    <span className="mt-0.5 block text-text-secondary">
                      May be listed on the public complaints &amp; suggestions register after review.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          </section>
        </div>
      </div>

      {formError ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <section className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="declaration"
            checked={declarationConfirmed}
            onChange={(event) => {
              setDeclarationConfirmed(event.target.checked);
              if (event.target.checked) {
                setErrors((current) => {
                  const next = { ...current };
                  delete next.declaration;
                  return next;
                });
              }
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border"
            aria-invalid={Boolean(errors.declaration)}
            aria-describedby={errors.declaration ? "declaration-error" : undefined}
          />
          <span className="text-text-secondary">
            <span className="font-medium text-foreground">Declaration:</span> I confirm that the
            information submitted is accurate to the best of my knowledge.
          </span>
        </label>
        {errors.declaration ? (
          <p id="declaration-error" role="alert" className="mt-2 text-sm text-danger">
            {errors.declaration}
          </p>
        ) : null}
      </section>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/student/dashboard"
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface-hover sm:w-auto"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          isLoading={isSubmitting}
          loadingText={
            submittingPhase === "uploading" ? "Uploading evidence..." : "Submitting report..."
          }
        >
          Submit case
        </Button>
      </div>
    </form>
  );
}
