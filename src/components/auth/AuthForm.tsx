"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/modules/auth/schema";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

interface ApiResponse {
  data?: { message?: string };
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

const messages: Record<AuthMode, { title: string; description?: string }> = {
  login: { title: "Welcome back", description: "Enter your details to view your wedding plans." },
  register: { title: "Create your account", description: "Free to use. Takes a minute." },
  "forgot-password": { title: "Reset your password", description: "Enter your email and we'll send you a reset link." },
  "reset-password": { title: "Choose a new password" },
};

function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm leading-5 text-primary" role="alert">
      <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

function PasswordVisibilityButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      onClick={onToggle}
      type="button"
    >
      {visible ? (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A11.8 11.8 0 0112 5c5.2 0 8.7 4.4 9.5 6-.3.7-1.3 2-3 3.5M6.2 6.2C3.9 7.5 2.8 9.7 2.5 11c.8 1.6 4.3 6 9.5 6 1 0 1.9-.2 2.7-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
      ) : (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
      )}
    </button>
  );
}

export function AuthForm({ mode, token = "" }: { mode: AuthMode; token?: string }) {
  const router = useRouter();
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isPasswordPage = mode === "login" || mode === "register" || mode === "reset-password";
  const heading = messages[mode];

  function setValidationErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errors: Record<string, string> = {};
    for (const issue of issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    if (mode === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setValidationErrors(parsed.error.issues);
        return;
      }
      setSubmitting(true);
      try {
        const result = await signIn("credentials", { ...parsed.data, redirect: false });
        if (!result || result.error) {
          setGeneralError("Email or password is incorrect.");
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      } catch {
        setGeneralError("Email or password is incorrect.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "register") {
      const parsed = registerSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        setValidationErrors(parsed.error.issues);
        return;
      }
      setSubmitting(true);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const payload = await response.json() as ApiResponse;
        if (!response.ok) {
          setFieldErrors(payload.error?.fields ?? {});
          setGeneralError(payload.error?.code === "EMAIL_TAKEN" ? payload.error.message ?? "An account with this email already exists." : payload.error?.message ?? "We couldn't create your account. Please try again.");
          return;
        }
        const result = await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
        if (!result || result.error) {
          setSuccessMessage("Your account is ready. Log in to continue.");
          return;
        }
        router.replace("/setup");
        router.refresh();
      } catch {
        setGeneralError("We couldn't create your account. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "forgot-password") {
      const parsed = forgotPasswordSchema.safeParse({ email });
      if (!parsed.success) {
        setValidationErrors(parsed.error.issues);
        return;
      }
      setSubmitting(true);
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
        });
        const payload = await response.json() as ApiResponse;
        if (!response.ok) {
          setFieldErrors(payload.error?.fields ?? {});
          setGeneralError(payload.error?.message ?? "We couldn't send the reset link. Please try again.");
          return;
        }
        setSuccessMessage(payload.data?.message ?? "If an account exists for that email, a reset link is on its way.");
      } catch {
        setGeneralError("We couldn't send the reset link. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setValidationErrors(parsed.error.issues);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        if (response.status === 410 || payload.error?.code === "LINK_EXPIRED") {
          setGeneralError("This link has expired or was already used.");
        } else {
          setFieldErrors(payload.error?.fields ?? {});
          setGeneralError(payload.error?.message ?? "We couldn't update your password. Please try again.");
        }
        return;
      }
      setSuccessMessage("Your password has been updated.");
    } catch {
      setGeneralError("We couldn't update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName = "h-11 w-full rounded-[10px] border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted/65 focus:border-primary focus:outline-none";

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl tracking-tight text-foreground">{heading.title}</h1>
        {heading.description ? <p className="mt-1 text-sm leading-6 text-muted">{heading.description}</p> : null}
      </div>

      {successMessage ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-muted" role="status">{successMessage}</p>
          {mode === "reset-password" || mode === "register" ? <Link className="inline-block whitespace-nowrap text-sm font-medium text-primary underline underline-offset-4" href="/login">Log in</Link> : null}
          {mode === "forgot-password" ? <Link className="inline-block whitespace-nowrap text-sm font-medium text-primary underline underline-offset-4" href="/login">Back to log in</Link> : null}
        </div>
      ) : mode === "reset-password" && !token ? (
        <div className="space-y-5">
          <ErrorMessage>This link has expired or was already used.</ErrorMessage>
          <Link className="inline-block whitespace-nowrap text-sm font-medium text-primary underline underline-offset-4" href="/forgot-password">Request another reset link</Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          {generalError ? <ErrorMessage>{generalError}</ErrorMessage> : null}
          {mode === "register" ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Full name</span>
              <input autoComplete="name" className={inputClassName} name="name" placeholder="Meera Sharma" />
              {fieldErrors.name ? <span className="text-sm font-normal text-primary">{fieldErrors.name}</span> : null}
            </label>
          ) : null}

          {mode === "login" || mode === "register" || mode === "forgot-password" ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Email</span>
              <input autoComplete="email" className={inputClassName} name="email" placeholder="meera@example.com" type="email" />
              {fieldErrors.email ? <span className="text-sm font-normal text-primary">{fieldErrors.email}</span> : null}
            </label>
          ) : null}

          {isPasswordPage ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span className="flex items-center justify-between gap-3">
                <span>{mode === "reset-password" ? "New password" : "Password"}</span>
                {mode === "login" ? <Link className="whitespace-nowrap text-xs font-medium text-primary underline underline-offset-4" href="/forgot-password">Forgot password?</Link> : null}
              </span>
              <span className="relative block">
                <input autoComplete={mode === "login" ? "current-password" : "new-password"} className={`${inputClassName} pr-12`} name="password" placeholder="••••••••" type={visiblePassword ? "text" : "password"} />
                <PasswordVisibilityButton visible={visiblePassword} onToggle={() => setVisiblePassword((value) => !value)} />
              </span>
              {mode !== "login" ? <span className="text-xs font-normal text-muted">At least 8 characters</span> : null}
              {fieldErrors.password ? <span className="text-sm font-normal text-primary">{fieldErrors.password}</span> : null}
            </label>
          ) : null}

          <button className="mt-1 inline-flex h-11 items-center justify-center whitespace-nowrap rounded-[10px] bg-primary px-5 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? "Please wait…" : mode === "login" ? "Log in" : mode === "register" ? "Create account" : mode === "forgot-password" ? "Send reset link" : "Update password"}
          </button>

          {mode === "login" || mode === "register" ? (
            <>
              <div className="mt-2 h-px w-full bg-border" />
              <p className="text-center text-sm text-muted">
                {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                <Link className="whitespace-nowrap font-medium text-primary underline underline-offset-4" href={mode === "login" ? "/register" : "/login"}>
                  {mode === "login" ? "Start planning" : "Log in"}
                </Link>
              </p>
            </>
          ) : null}
          {mode === "forgot-password" ? <Link className="self-center whitespace-nowrap text-sm font-medium text-primary underline underline-offset-4" href="/login">Back to log in</Link> : null}
        </form>
      )}
    </div>
  );
}
