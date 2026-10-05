import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How LostLink Works — Report, Verify, Claim, Recover" },
      {
        name: "description",
        content:
          "Understand the LostLink workflow: report an item, admin verification, public listing, claim submission, claim review and recovery.",
      },
      { property: "og:title", content: "How LostLink Works" },
      {
        property: "og:description",
        content: "The full campus lost-and-found workflow from report to recovery.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const flow = [
  { title: "1. Register and sign in", text: "Create an account with your college email, department and student ID." },
  { title: "2. Report a lost or found item", text: "Fill in the item details, upload a photo and record when and where it happened." },
  { title: "3. Pending verification", text: "Your report is saved with a Pending status and is not yet publicly visible." },
  { title: "4. Admin review", text: "An administrator opens the report, checks the details and approves or rejects it with a reason." },
  { title: "5. Public listing", text: "Approved reports appear in Browse Items where anyone can search and filter them." },
  { title: "6. Claim submission", text: "A student who recognises a found item opens it and answers ownership verification questions." },
  { title: "7. Claim review", text: "An administrator compares the claim answers with the report and approves or rejects the claim." },
  { title: "8. Recovery", text: "On approval the claim is marked Approved, the item becomes Recovered and both parties are notified." },
];

function HowItWorksPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <PageHeading
          title="How LostLink works"
          description="Every item follows the same verified path from report to recovery."
        />

        <ol className="mt-10 space-y-4">
          {flow.map((step) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/report/lost">
              Report a lost item <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/browse">Browse verified items</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
