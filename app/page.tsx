import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { StatusBadge } from "@/components/status-badge";
import { MetricTile, PageHeader, Panel } from "@/components/ui";
import { getDashboardData } from "@/lib/outreach-data";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  noStore();

  const {
    metrics,
    dueThreads,
    recentThreads,
    statuses,
    campaignRows,
  } = await getDashboardData();

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Dashboard"
        title="Dashboard"
        actions={
          <>
            <Link href="/threads/new" className="button-primary">
              New thread
            </Link>
            <Link href="/threads" className="button-secondary">
              Open threads
            </Link>
          </>
        }
      />

      <section className="grid flex-none gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricTile label="Threads" value={metrics.totalThreads.toString()} />
        <MetricTile label="Due now" value={metrics.dueThreads.toString()} />
        <MetricTile label="Contacts" value={metrics.contacts.toString()} />
        <MetricTile label="Campaigns" value={metrics.activeCampaigns.toString()} />
        <MetricTile label="Events this week" value={metrics.activitiesThisWeek.toString()} />
      </section>

      <section className="mt-4 grid min-h-0 flex-1 overflow-hidden gap-4 xl:grid-cols-[0.95fr_1fr_1fr] xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Recent threads"
          className="flex min-h-0 flex-col xl:row-span-2"
          bodyClassName="flex min-h-0 flex-1 flex-col"
          action={
            <Link href="/threads" className="button-secondary text-sm">
              Browse threads
            </Link>
          }
        >
          <div className="min-h-0 flex-1 overflow-auto pr-2">
            <div className="grid gap-3">
            {recentThreads.length ? (
              recentThreads.slice(0, 6).map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${thread.id}`}
                  className="border border-stone-950/8 bg-white/82 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{thread.title}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {thread.contact.name}
                        {thread.contact.organization ? ` · ${thread.contact.organization}` : ""}
                      </p>
                    </div>
                    <StatusBadge
                      color={thread.status.color}
                      label={thread.status.name}
                      bucket={thread.status.bucket}
                    />
                  </div>
                  {thread.campaign ? (
                    <p className="mt-2 text-sm text-stone-700">{thread.campaign.name}</p>
                  ) : null}
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-stone-950/12 bg-white/76 p-4 text-sm text-stone-600">
                No threads yet.
              </div>
            )}
            </div>
          </div>
        </Panel>

        <Panel
          title="Follow-ups due"
          className="flex min-h-0 flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col"
          action={
            <Link href="/threads?due=1" className="button-secondary text-sm">
              View all due
            </Link>
          }
        >
          <div className="min-h-0 flex-1 overflow-auto pr-2">
            <div className="grid gap-3">
            {dueThreads.length ? (
              dueThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${thread.id}`}
                  className="border border-stone-950/8 bg-stone-950/[0.035] p-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{thread.title}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {thread.contact.name}
                        {thread.campaign ? ` · ${thread.campaign.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge
                      color={thread.status.color}
                      label={thread.status.name}
                      bucket={thread.status.bucket}
                    />
                  </div>
                  <p className="mt-2 text-sm text-stone-700">
                    Due {formatDate(thread.nextFollowUpAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-stone-950/12 bg-white/76 p-4 text-sm text-stone-600">
                Nothing is overdue right now.
              </div>
            )}
            </div>
          </div>
        </Panel>

        <Panel title="Campaigns" className="flex min-h-0 flex-col" bodyClassName="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto pr-2">
            <div className="grid gap-3">
            {campaignRows.length ? (
              campaignRows.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="border border-stone-950/8 bg-white/82 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-950">{campaign.name}</p>
                    <span className="border border-stone-950/10 bg-stone-950/6 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-700">
                      {campaign._count.threads}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-stone-950/12 bg-white/76 p-4 text-sm text-stone-600">
                No campaigns yet.
              </div>
            )}
            </div>
          </div>
        </Panel>

        <Panel title="Status mix" className="flex min-h-0 flex-col xl:col-span-2" bodyClassName="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto pr-2">
            <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between gap-3">
                <StatusBadge
                  color={status.color}
                  label={status.name}
                  bucket={status.bucket}
                />
                <span className="text-sm font-semibold text-stone-700">
                  {status._count.threads}
                </span>
              </div>
            ))}
            </div>
          </div>
        </Panel>
      </section>
    </main>
  );
}
