import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { ContactModal } from "@/components/contact-modal";
import { CopyValueButton, XHandleLink } from "@/components/contact-value-actions";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { getContactPageData } from "@/lib/outreach-data";
import { formatDate } from "@/lib/utils";

type ContactPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  noStore();

  const { id } = await params;
  const data = await getContactPageData(id);

  if (!data) {
    notFound();
  }

  const { contact, threads, activities } = data;
  const email = contact.channels.find((channel) => channel.platform === "email")?.value ?? "";
  const xHandle = contact.channels.find((channel) => channel.platform === "x")?.value ?? "";

  return (
    <main>
      <PageHeader
        eyebrow="Contact"
        title={contact.name}
        actions={
          <>
            <Link href="/contacts" className="button-secondary">
              Back
            </Link>
            <Link href={`/threads/new?contactId=${contact.id}`} className="button-primary">
              New thread
            </Link>
            <ContactModal
              contact={{
                id: contact.id,
                name: contact.name,
                organization: contact.organization,
                email,
                xHandle,
                notes: contact.notes,
              }}
              triggerLabel="Edit"
              triggerClassName="button-secondary !w-auto"
            />
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Overview">
          <div className="overflow-x-auto border border-stone-950/8 bg-white/86">
            <table className="min-w-full border-collapse text-[11px] md:text-xs">
              <tbody>
                <tr>
                  <th className="w-[120px] border border-stone-950/8 bg-stone-950/6 px-2 py-1.5 text-left uppercase tracking-[0.16em] text-stone-600">
                    Org
                  </th>
                  <td className="border border-stone-950/8 px-2 py-1.5 text-stone-800">
                    {contact.organization || ""}
                  </td>
                </tr>
                <tr>
                  <th className="border border-stone-950/8 bg-stone-950/6 px-2 py-1.5 text-left uppercase tracking-[0.16em] text-stone-600">
                    Email
                  </th>
                  <td className="border border-stone-950/8 px-2 py-1.5 text-stone-800">
                    <CopyValueButton value={email} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-stone-950/8 bg-stone-950/6 px-2 py-1.5 text-left uppercase tracking-[0.16em] text-stone-600">
                    X
                  </th>
                  <td className="border border-stone-950/8 px-2 py-1.5 text-stone-800">
                    <XHandleLink value={xHandle} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-stone-950/8 bg-stone-950/6 px-2 py-1.5 text-left uppercase tracking-[0.16em] text-stone-600">
                    Threads
                  </th>
                  <td className="border border-stone-950/8 px-2 py-1.5 text-stone-800">
                    {contact._count.threads}
                  </td>
                </tr>
                <tr>
                  <th className="border border-stone-950/8 bg-stone-950/6 px-2 py-1.5 text-left uppercase tracking-[0.16em] text-stone-600">
                    Notes
                  </th>
                  <td className="border border-stone-950/8 px-2 py-1.5 text-stone-800">
                    <div className="min-h-10 whitespace-pre-wrap">{contact.notes || ""}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Threads">
          {threads.length ? (
            <div className="overflow-x-auto border border-stone-950/8 bg-white/86">
              <table className="min-w-full border-collapse text-[11px] md:text-xs">
                <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                  <tr>
                    <th className="border border-stone-950/8 px-2 py-1.5">Title</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Platform</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Status</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Campaign</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Updated</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((thread) => (
                    <tr key={thread.id}>
                      <td className="border border-stone-950/8 px-2 py-1.5 font-semibold text-stone-900">
                        {thread.title}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {thread.platform}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5">
                        <StatusBadge
                          color={thread.status.color}
                          label={thread.status.name}
                          bucket={thread.status.bucket}
                        />
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {thread.campaign ? (
                          <Link href={`/campaigns/${thread.campaign.id}`} className="retro-link">
                            {thread.campaign.name}
                          </Link>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {formatDate(thread.updatedAt)}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5">
                        <Link href={`/threads/${thread.id}`} className="button-secondary !w-auto px-3 py-1.5">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState actionHref={`/threads/new?contactId=${contact.id}`} actionLabel="New thread" title="No threads yet." />
          )}
        </Panel>
      </section>

      <section className="mt-4">
        <Panel title="Activity">
          {activities.length ? (
            <div className="overflow-x-auto border border-stone-950/8 bg-white/86">
              <table className="min-w-full border-collapse text-[11px] md:text-xs">
                <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                  <tr>
                    <th className="border border-stone-950/8 px-2 py-1.5">When</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Thread</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Type</th>
                    <th className="border border-stone-950/8 px-2 py-1.5">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="align-top">
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {formatDate(activity.happenedAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-900">
                        <Link href={`/threads/${activity.thread.id}`} className="retro-link">
                          {activity.thread.title}
                        </Link>
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {activity.type}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        <div className="max-w-[90ch] whitespace-pre-wrap break-words">
                          {activity.content}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No activity yet." />
          )}
        </Panel>
      </section>
    </main>
  );
}
