import { unstable_noStore as noStore } from "next/cache";

import {
  addThreadPlatformAction,
  addStatusAction,
  deleteThreadPlatformAction,
  deleteStatusAction,
} from "@/app/actions";
import { StatusColorPicker } from "@/components/status-color-picker";
import { StatusBadge } from "@/components/status-badge";
import { Field, PageHeader, Panel } from "@/components/ui";
import { DEFAULT_STATUS_COLOR } from "@/lib/constants";
import { getSettingsPageData } from "@/lib/outreach-data";
import { normalizeStatusColor } from "@/lib/utils";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  noStore();

  const resolvedSearchParams = (await searchParams) ?? {};
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : null;
  const { statuses, platforms } = await getSettingsPageData();

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        actions={
          <a href="/api/export" className="button-secondary">
            Export all CSV
          </a>
        }
      />

      {error ? (
        <p className="mb-6 border border-stone-950/10 bg-white/76 px-3 py-2 text-sm text-stone-700">
          Action failed: {error.replaceAll("-", " ")}.
        </p>
      ) : null}

      <section className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Panel title="New status">
            <form action={addStatusAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status name">
                  <input className="field" name="name" placeholder="Waiting on referral" />
                </Field>
                <Field label="Color">
                  <StatusColorPicker defaultValue={DEFAULT_STATUS_COLOR} />
                </Field>
              </div>
              <label className="inline-flex items-center gap-3 border border-stone-950/10 bg-white/72 px-3 py-2 text-sm font-semibold text-stone-700">
                <input type="checkbox" name="isDefault" />
                Make default
              </label>
              <button className="button-primary w-full" type="submit">
                Save status
              </button>
            </form>
          </Panel>

          <Panel title="New platform">
            <form action={addThreadPlatformAction} className="space-y-4">
              <Field label="Platform name">
                <input className="field" name="name" placeholder="farcaster" />
              </Field>
              <button className="button-primary w-full" type="submit">
                Save platform
              </button>
            </form>
          </Panel>
        </div>

        <div className="grid min-h-0 gap-6 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel
            title="Status library"
            className="flex min-h-0 flex-col"
            bodyClassName="min-h-0 flex-1 p-3"
          >
            <div className="retro-scroll h-full overflow-auto pr-2">
              <div className="space-y-3">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between border border-stone-950/8 bg-white/82 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      color={status.color}
                      label={status.name}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {normalizeStatusColor(status.color)}
                    </span>
                    {status.isDefault ? (
                      <span className="border border-stone-950/10 bg-stone-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-stone-600">
                      {status._count.threads} threads
                    </span>
                    <form action={deleteStatusAction.bind(null, status.id)}>
                      <button className="button-danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </Panel>

          <Panel
            title="Platform library"
            className="flex min-h-0 flex-col"
            bodyClassName="min-h-0 flex-1 p-3"
          >
            <div className="retro-scroll h-full overflow-auto pr-2">
              <div className="space-y-3">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="flex items-center justify-between border border-stone-950/8 bg-white/82 px-3 py-2"
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-800">
                    {platform.name}
                  </span>
                  <form action={deleteThreadPlatformAction.bind(null, platform.id)}>
                    <button className="button-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              ))}
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
