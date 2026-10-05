import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LostLink" },
      { name: "description", content: "How LostLink collects, uses and protects your information." },
      { property: "og:title", content: "Privacy Policy — LostLink" },
      { property: "og:description", content: "LostLink privacy policy." },
    ],
  }),
  component: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground">
        <PageHeading title="Privacy Policy" />
        <p>LostLink collects only the information needed to run the campus lost-and-found service: your name, email, phone, department, student ID, and the reports and claims you submit.</p>
        <p>Passwords are never stored in plain text — authentication is handled by a secure identity service using salted hashing. Public item listings never show your email or phone number.</p>
        <p>Claim details are visible only to you, the person who reported the item, and campus administrators. Images you upload are kept in private storage and shown through short-lived links.</p>
        <p>You can update your profile at any time. To delete your account, contact the admin team through the Help page.</p>
      </div>
    </PageShell>
  ),
});
