import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/Guards";
import { ReportItemForm } from "@/components/items/ReportItemForm";
import { PageHeading, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/report/found")({
  head: () => ({
    meta: [
      { title: "Report a Found Item — LostLink" },
      { name: "description", content: "Found something on campus? Report it so the owner can claim it." },
      { property: "og:title", content: "Report a Found Item — LostLink" },
      { property: "og:description", content: "Help reunite a found item with its owner." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <PageHeading title="Report a Found Item" description="Hand the item to the admin desk if possible, then submit this report." />
          <ReportItemForm type="found" />
        </div>
      </RequireAuth>
    </PageShell>
  ),
});
