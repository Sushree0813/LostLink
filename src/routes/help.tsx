import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Contact — LostLink" },
      { name: "description", content: "Learn how to report, search and claim items on LostLink, or contact the admin team." },
      { property: "og:title", content: "Help & Contact — LostLink" },
      { property: "og:description", content: "Guides and contact form for LostLink." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  ["How do I report a lost or found item?", "Log in, choose Report Item, pick Lost or Found, and fill in the item name, category, description, date, time, location and an optional photo. Your report is then marked Pending Verification."],
  ["How do I search for an item?", "Open Browse Items. Search by name, description, brand or location, and filter by Lost/Found, category, status, location and date."],
  ["How do I submit a claim?", "Open a verified FOUND item and click “I Want to Claim This Item”. Explain why it's yours, describe a unique identifying feature, and add when and where you lost it."],
  ["What happens after I claim?", "An admin reviews your answers. If approved, the item is marked Recovered and you're notified to collect it from the admin desk with your student ID. If rejected, you'll see the reason in My Claims."],
  ["How does admin verification work?", "Every report is checked by an admin before it appears publicly. Admins approve genuine reports and reject incomplete or suspicious ones with a reason, and you get a notification either way."],
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

function HelpPage() {
  const [v, setV] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setBusy(false);
    if (error) { toast.error("Could not send message. Please try again."); return; }
    toast.success("Message sent. The admin team will get back to you.");
    setV({ name: "", email: "", subject: "", message: "" });
  }
  const bind = (k: keyof typeof v) => ({ id: k, value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <PageHeading title="Help Center" description="Everything you need to know about using LostLink." />
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <form onSubmit={submit} className="space-y-4 self-start rounded-xl border border-border bg-card p-6 lg:col-span-2" noValidate>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Mail className="h-5 w-5 text-primary" /> Contact the admin team</h2>
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input {...bind("name")} /></div>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input type="email" {...bind("email")} /></div>
          <div className="space-y-1.5"><Label htmlFor="subject">Subject</Label><Input {...bind("subject")} /></div>
          <div className="space-y-1.5"><Label htmlFor="message">Message</Label><Textarea rows={5} {...bind("message")} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send message</Button>
        </form>
      </div>
    </PageShell>
  );
}
