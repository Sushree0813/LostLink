import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Handshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { getPublicStats } from "@/services/stats";
import campusHero from "@/assets/campus-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LostLink — Campus Lost and Found Management System" },
      {
        name: "description",
        content:
          "Report lost and found items, search verified listings, submit claims and recover belongings on your campus with LostLink.",
      },
      { property: "og:title", content: "LostLink — Report. Search. Claim. Recover." },
      {
        property: "og:description",
        content:
          "A secure campus lost-and-found platform for students and staff to report, discover, verify and recover belongings.",
      },
    ],
  }),
  component: LandingPage,
});

const steps = [
  {
    icon: ClipboardList,
    title: "Report",
    text: "Submit a lost or found item with photos, location and identifying details.",
  },
  {
    icon: Search,
    title: "Search",
    text: "Browse verified listings and filter by category, location, date and status.",
  },
  {
    icon: Handshake,
    title: "Claim",
    text: "Answer verification questions to prove ownership of a found item.",
  },
  {
    icon: PackageCheck,
    title: "Recover",
    text: "Once an admin approves the claim, collect your belonging and close the loop.",
  },
];

const features = [
  { icon: ClipboardList, title: "Easy Reporting", text: "Guided forms capture everything an admin needs to verify a report." },
  { icon: Search, title: "Smart Search", text: "Search by name, brand, description or location with layered filters." },
  { icon: ShieldCheck, title: "Secure Claims", text: "Ownership is proven through structured questions, not one-click buttons." },
  { icon: BadgeCheck, title: "Verified Items", text: "Only admin-approved reports ever appear in the public listing." },
  { icon: Timer, title: "Real-Time Status", text: "Track every report and claim from pending to recovered." },
  { icon: Siren, title: "Admin Verification", text: "A dedicated review desk keeps spam and false claims out." },
];

function LandingPage() {
  const { data: stats } = useQuery({ queryKey: ["public-stats"], queryFn: getPublicStats });

  const statCards = [
    { label: "Total Reports", value: stats?.total_reports ?? 0, icon: ClipboardList },
    { label: "Lost Items", value: stats?.lost_items ?? 0, icon: Siren },
    { label: "Found Items", value: stats?.found_items ?? 0, icon: Sparkles },
    { label: "Recovered Items", value: stats?.recovered_items ?? 0, icon: PackageCheck },
    { label: "Active Users", value: stats?.active_users ?? 0, icon: Users },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-0 surface-grid opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified campus lost &amp; found
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Lost Something? Found Something? LostLink Helps You Reunite With It.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              LostLink is a secure campus lost-and-found platform that helps students and staff
              report, discover, verify, and recover belongings through one centralized system.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/report/lost">
                  Report Lost Item <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/report/found">Report Found Item</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/browse">Browse Items</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-lift)]">
              <img
                src={campusHero}
                alt="Students walking across a campus courtyard"
                className="h-72 w-full object-cover sm:h-96"
              />
            </div>
            <div className="absolute -bottom-6 left-6 hidden rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] sm:block">
              <p className="text-xs font-medium text-muted-foreground">Recovered so far</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {stats?.recovered_items ?? 0} items
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]"
            >
              <stat.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-3xl font-semibold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-foreground">How It Works</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Four simple steps replace notice boards, group chats and word of mouth.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    STEP {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          Everything a campus recovery desk needs
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <feature.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground">About LostLink</h2>
            <p className="mt-4 text-muted-foreground">
              On a busy campus, lost belongings are reported across scattered WhatsApp groups,
              notice boards and department desks. Items are rarely traceable, claims cannot be
              verified, and there is no record of what was recovered.
            </p>
            <p className="mt-3 text-muted-foreground">
              LostLink centralises the entire process. Every report is verified by an administrator
              before it becomes public, every claim is backed by ownership proof, and every
              recovery is logged — giving the institution a searchable, accountable history.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/how-it-works">
                See the full workflow <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Centralised", text: "One listing for the whole campus, not ten group chats." },
              { title: "Accountable", text: "Admin verification and activity logs for every action." },
              { title: "Secure", text: "Role-based access, protected routes and validated uploads." },
              { title: "Searchable", text: "Filter by category, location, date and recovery status." },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
