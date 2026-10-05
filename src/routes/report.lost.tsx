import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/Guards";
import { ReportItemForm } from "@/components/items/ReportItemForm";
import { PageHeading, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/report/lost")({
  head: () => ({
    meta: [
      { title: "Report a Lost Item — LostLink" },
      { name: "description", content: "Report an item you lost on campus so others can help return it." },
      { property: "og:title", content: "Report a Lost Item — LostLink" },
      { property: "og:description", content: "Report an item you lost on campus." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <PageHeading title="Report a Lost Item" description="Give as much detail as possible. Your report is verified by an admin before it goes public." />
          <ReportItemForm type="lost" />
        </div>
      </RequireAuth>
    </PageShell>
  ),
});
