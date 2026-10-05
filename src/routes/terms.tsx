import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — LostLink" },
      { name: "description", content: "Rules for using the LostLink campus lost-and-found platform." },
      { property: "og:title", content: "Terms of Use — LostLink" },
      { property: "og:description", content: "LostLink terms of use." },
    ],
  }),
  component: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground">
        <PageHeading title="Terms of Use" />
        <p>LostLink is for students and staff of the campus. Reports and claims must be truthful. False claims are a disciplinary offence and may lead to account deactivation.</p>
        <p>Found items should be handed to the admin desk. Items are released only after an administrator approves a claim and checks the claimant's student ID.</p>
        <p>Administrators may reject, edit or remove reports that are incomplete, duplicated or inappropriate.</p>
        <p>The service is provided as-is to help reunite people with their belongings. The institution is not liable for items that are not recovered.</p>
      </div>
    </PageShell>
  ),
});
