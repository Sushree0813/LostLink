import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — LostLink" },
      { name: "description", content: "Request a password reset link for your LostLink account." },
      { property: "og:title", content: "Reset your password — LostLink" },
      { property: "og:description", content: "Request a LostLink password reset link." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-10 w-10 text-success" />
              <h1 className="mt-4 font-display text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for {email}, we've sent a link to reset your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold">Forgot password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send reset link
              </Button>
            </form>
          )}

          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/auth">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
