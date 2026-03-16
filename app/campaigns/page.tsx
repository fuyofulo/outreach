import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CampaignModal } from "@/components/campaign-modal";
import { EmptyState, Field, PageHeader, Panel } from "@/components/ui";
import { getCampaignsPageData } from "@/lib/outreach-data";

type CampaignsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  noStore();

  const resolvedSearchParams = (await searchParams) ?? {};
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : null;
  const { campaigns } = await getCampaignsPageData(q);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Campaigns"
        title="Campaigns"
        actions={<CampaignModal />}
      />

      {error ? (
        <p className="mb-4 border border-stone-950/10 bg-white/76 px-3 py-2 text-sm text-stone-700">
          Action failed: {error.replaceAll("-", " ")}.
        </p>
      ) : null}

      <Panel
        title="Library"
        className="flex min-h-0 flex-1 flex-col"
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        <form className="mb-0 flex flex-wrap items-end gap-2 border-b border-stone-950/8 p-3">
          <Field label="Search">
            <input
              className="field w-[220px]"
              name="q"
              defaultValue={q ?? ""}
              placeholder="job search, feedback..."
            />
          </Field>
          <button className="button-primary !w-auto" type="submit">
            Search
          </button>
          <Link href="/campaigns" className="button-secondary !w-auto">
            Reset
          </Link>
        </form>

        {campaigns.length ? (
          <div className="min-h-0 flex-1 overflow-auto border-y border-stone-950/8 bg-white/86">
            <table className="w-full border-collapse text-[11px] md:text-xs">
              <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="w-[210px] border border-stone-950/8 px-2 py-1.5">Name</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Objective</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Status</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Threads</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Description</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="align-top">
                    <td className="w-[210px] border border-stone-950/8 px-2 py-1.5 font-semibold text-stone-950">
                      <Link href={`/campaigns/${campaign.id}`} className="retro-link font-semibold">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {campaign.objective || ""}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {campaign.status}
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                      {campaign._count.threads}
                    </td>
                    <td
                      className="border border-stone-950/8 px-2 py-1.5 text-stone-700"
                      title={campaign.description ?? ""}
                    >
                      <div className="max-w-[28ch] truncate">
                        {campaign.description || ""}
                      </div>
                    </td>
                    <td className="border border-stone-950/8 px-2 py-1.5">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="button-secondary !w-auto px-3 py-1.5"
                        >
                          Open
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
                          triggerClassName="button-secondary !w-auto px-3 py-1.5"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No campaigns yet." />
        )}
      </Panel>
    </main>
  );
}
