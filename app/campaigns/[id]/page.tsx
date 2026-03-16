import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { CampaignModal } from "@/components/campaign-modal";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { getCampaignPageData } from "@/lib/outreach-data";
import { formatDate } from "@/lib/utils";

type CampaignPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignPage({ params }: CampaignPageProps) {
  noStore();

  const { id } = await params;
  const data = await getCampaignPageData(id);

  if (!data) {
    notFound();
  }

  const { campaign, threads } = data;

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Campaign"
        title={campaign.name}
        actions={
          <>
            <Link href="/campaigns" className="button-secondary">
              Back
            </Link>
            <CampaignModal
              campaign={{
                id: campaign.id,
                name: campaign.name,
                objective: campaign.objective,
                description: campaign.description,
                status: campaign.status,
              }}
              triggerLabel="Edit"
              triggerClassName="button-secondary !w-auto"
            />
          </>
        }
      />

      <Panel
        title="Threads"
        className="flex min-h-0 flex-1 flex-col"
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        {campaign.description || campaign.objective ? (
          <div className="border-b border-stone-950/10 px-4 py-3 text-[12px] text-stone-700">
            {campaign.objective ? <div><strong>Objective:</strong> {campaign.objective}</div> : null}
            {campaign.description ? <div className="mt-1 whitespace-pre-wrap">{campaign.description}</div> : null}
          </div>
        ) : null}

        {threads.length ? (
          <div className="min-h-0 flex-1 overflow-auto border-y border-stone-950/8 bg-white/86">
            <table className="w-full border-collapse text-[11px] md:text-xs">
              <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="w-[210px] border border-stone-950/8 px-2 py-1.5">Contact</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Org</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Platform</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Status</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Last edited</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Open</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id}>
                    <td className="w-[210px] border border-stone-950/8 px-2 py-1.5 font-semibold text-stone-900">
                      <Link href={`/contacts/${thread.contact.id}`} className="retro-link font-semibold">
                        {thread.contact.name}
                      </Link>
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {thread.contact.organization ?? ""}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {thread.platform}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {thread.status.name}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {formatDate(thread.updatedAt, {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
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
          <EmptyState title="No threads in this campaign yet." />
        )}
      </Panel>
    </main>
  );
}
