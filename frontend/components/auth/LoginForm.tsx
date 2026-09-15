"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { formatApiError, getFieldErrors } from "@/lib/errors";
import { placeholders } from "@/lib/placeholders";
import { getDashboardRoute } from "@/lib/routes";

function buildLoginPayload(username: string, password: string) {
  const trimmed = username.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed, password };
  }
  return { mc_number: trimmed, password };
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setErrors({});
    setIsSubmitting(true);

    try {
      const profile = await login(buildLoginPayload(username, password));
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("\\")
        ? returnTo
        : getDashboardRoute(profile.role);
      router.push(safeReturnTo);
    } catch (error) {
      setFormError(formatApiError(error, "We couldn't sign you in. Please check your details."));
      setErrors(getFieldErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const usernameError = errors.mc_number || errors.email;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <FormField
        label="Username (MC number)"
        htmlFor="username"
        required
        error={usernameError}
      >
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={placeholders.username}
          hasError={Boolean(usernameError)}
          required
        />
      </FormField>

      <FormField
        label="Password (CPM number)"
        htmlFor="password"
        required
        error={errors.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={placeholders.password}
          hasError={Boolean(errors.password)}
          required
        />
      </FormField>

      {formError ? (
        <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <p className="mb-4 text-sm text-text-secondary">
        Student accounts are issued by the university. Contact the faculty office if you cannot sign in.
      </p>

      <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting} loadingText="Signing in...">
        Sign in
      </Button>
    </form>
  );
}
