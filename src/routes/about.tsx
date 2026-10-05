import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About LostLink — Campus Lost and Found Platform" },
      {
        name: "description",
        content:
          "LostLink replaces scattered WhatsApp groups and notice boards with one verified campus lost-and-found system.",
      },
      { property: "og:title", content: "About LostLink" },
      {
        property: "og:description",
        content: "Why a centralised campus lost-and-found platform matters.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <PageHeading title="About LostLink" description="Report. Search. Claim. Recover." />
        <div className="mt-8 space-y-4 text-muted-foreground">
          <p>
            Every campus loses hundreds of belongings each semester — ID cards, phones, wallets,
            chargers, keys and books. Most of them are reported informally: a message in a class
            group, a paper note on a board, a word at the department desk. Nothing is searchable,
            nothing is verified, and nobody records what was actually returned.
          </p>
          <p>
            LostLink brings that process into one platform. Students report lost and found items
            with photos and identifying details. Administrators verify each report before it becomes
            public, so the listing stays trustworthy. Anyone can search and filter verified items,
            and ownership is proven through a structured claim form rather than a single button.
          </p>
          <p>
            When an administrator approves a claim, the item is marked as recovered, both parties
            are notified, and the action is written to the activity log. The institution ends up
            with a complete, auditable record of campus recoveries.
          </p>
          <h2 className="pt-4 font-display text-xl font-semibold text-foreground">Project scope</h2>
          <p>
            LostLink is built as a full-stack web application: a React and TypeScript frontend, a
            PostgreSQL database with row-level security, authenticated sessions with hashed
            credentials, secure image storage, and role-based access for students, admins and super
            admins.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
