import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Login or Register — LostLink" },
      {
        name: "description",
        content:
          "Sign in to LostLink or create a student account to report lost items, submit claims and track recoveries.",
      },
      { property: "og:title", content: "Login or Register — LostLink" },
      {
        property: "og:description",
        content: "Access your LostLink campus lost-and-found account.",
      },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(8, "Enter a valid phone number"),
    department: z.string().min(2, "Department is required"),
    studentId: z.string().min(3, "Student ID is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: search.redirect ?? "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, search.redirect]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Logo />
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Report. Search. Claim. Recover.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            One verified campus lost-and-found desk — with admin verification, ownership proof and a
            full recovery trail.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          LostLink — Campus Lost and Found Management System
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <RegisterForm onRegistered={() => setTab("login")} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = z
      .object({ email: z.string().email("Enter a valid email address"), password: z.string().min(1, "Password is required") })
      .safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    toast.success("Welcome back to LostLink");
    void navigate({ to: search.redirect ?? "/dashboard", replace: true });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your reports and claims.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            className="pl-9"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="pl-9"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}

function RegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    studentId: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    // Student IDs must be unique across the platform.
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("student_id", values.studentId)
      .maybeSingle();
    if (existing) {
      setSubmitting(false);
      setErrors({ studentId: "This student ID is already registered." });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: values.fullName,
          phone: values.phone,
          department: values.department,
          student_id: values.studentId,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      const message = error.message.toLowerCase().includes("already")
        ? "An account with this email already exists."
        : error.message;
      setErrors({ email: message });
      return;
    }

    if (data.session) {
      toast.success("Account created. Welcome to LostLink!");
      void navigate({ to: "/dashboard", replace: true });
      return;
    }

    toast.success("Account created. Please sign in to continue.");
    onRegistered();
  }

  const fields: {
    id: keyof typeof values;
    label: string;
    type?: string;
    placeholder: string;
    autoComplete?: string;
  }[] = [
    { id: "fullName", label: "Full Name", placeholder: "Ananya Sharma", autoComplete: "name" },
    { id: "email", label: "Email", type: "email", placeholder: "you@college.edu", autoComplete: "email" },
    { id: "phone", label: "Phone", placeholder: "+91 98110 00000", autoComplete: "tel" },
    { id: "department", label: "College / Department", placeholder: "Information Technology" },
    { id: "studentId", label: "Student ID", placeholder: "IT2021045" },
    { id: "password", label: "Password", type: "password", placeholder: "At least 8 characters", autoComplete: "new-password" },
    { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Re-enter password", autoComplete: "new-password" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register with your college details to start reporting items.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className={`space-y-2 ${field.id === "fullName" || field.id === "email" ? "sm:col-span-2" : ""}`}
          >
            <Label htmlFor={`register-${field.id}`}>{field.label}</Label>
            <Input
              id={`register-${field.id}`}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              {...(field.autoComplete ? { autoComplete: field.autoComplete } : {})}
              value={values[field.id]}
              onChange={(e) => update(field.id, e.target.value)}
              aria-invalid={Boolean(errors[field.id])}
              required
            />
            {errors[field.id] ? (
              <p className="text-xs text-destructive">{errors[field.id]}</p>
            ) : null}
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Passwords are hashed and stored securely by the authentication service — never in the app
        database.
      </p>
    </form>
  );
}
