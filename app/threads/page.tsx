import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { CustomSelect } from "@/components/custom-select";
import { EmptyState, Field, PageHeader, Panel } from "@/components/ui";
import { Filters, getThreadsPageData } from "@/lib/outreach-data";

type ThreadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ThreadsPage({ searchParams }: ThreadsPageProps) {
  noStore();

  const resolvedSearchParams = (await searchParams) ?? {};
  const filters: Filters = {
    q:
      typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined,
    platform:
      typeof resolvedSearchParams.platform === "string"
        ? resolvedSearchParams.platform
        : undefined,
    statusId:
      typeof resolvedSearchParams.statusId === "string"
        ? resolvedSearchParams.statusId
        : undefined,
  };

  const { threads, statuses, platforms } = await getThreadsPageData(filters);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Threads"
        title="Threads"
        actions={<Link href="/threads/new" className="button-primary">New thread</Link>}
      />

      <Panel title="Library" className="flex min-h-0 flex-1 flex-col" bodyClassName="flex min-h-0 flex-1 flex-col p-0">
        <form className="mb-0 grid gap-2 border-b border-stone-950/8 p-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto_auto]">
          <Field label="Search">
            <input
              className="field"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="contact, org, message..."
            />
          </Field>
          <Field label="Platform">
            <CustomSelect
              name="platform"
              defaultValue={filters.platform ?? ""}
              options={[
                { value: "", label: "All" },
                ...platforms.map((platform) => ({
                  value: platform.name,
                  label: platform.name,
                })),
              ]}
              placeholder="All"
            />
          </Field>
          <Field label="Status">
            <CustomSelect
              name="statusId"
              defaultValue={filters.statusId ?? ""}
              options={[
                { value: "", label: "All" },
                ...statuses.map((status) => ({
                  value: status.id,
                  label: status.name,
                })),
              ]}
              placeholder="All"
            />
          </Field>
          <button className="button-primary mt-[22px] !w-auto" type="submit">
            Search
          </button>
          <Link href="/threads" className="button-secondary mt-[22px] !w-auto">
            Reset
          </Link>
        </form>

        {threads.length ? (
          <div className="min-h-0 flex-1 overflow-auto border-y border-stone-950/8 bg-white/86">
            <table className="w-full border-collapse text-[11px] md:text-xs">
              <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="w-[210px] border border-stone-950/8 px-2 py-1.5">Contact</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Thread</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Org</th>
                  <th className="border border-stone-950/8 px-2 py-1.5 w-[86px]">Platform</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Status</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Campaign</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Latest</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Open</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id} className="align-top">
                    <td className="w-[210px] border border-stone-950/8 px-2 py-1.5">
                      <Link href={`/contacts/${thread.contact.id}`} className="retro-link font-semibold">
                        {thread.contact.name}
                      </Link>
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {thread.title}
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
                      {thread.campaign ? (
                        <Link href={`/campaigns/${thread.campaign.id}`} className="retro-link">
                          {thread.campaign.name}
                        </Link>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      <div className="max-w-[34ch] truncate">
                        {thread.activities[0]?.type === "message"
                          ? "Message"
                          : thread.activities[0]?.type || thread.summary || ""}
                      </div>
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
          <EmptyState actionHref="/threads/new" actionLabel="Create thread" title="No threads yet." />
        )}
      </Panel>
    </main>
  );
}
