import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

type ThreadCardProps = {
  thread: {
    id: string;
    title: string;
    summary: string | null;
    platform: string;
    platformIdentity: string | null;
    priority: number;
    nextFollowUpAt: Date | null;
    updatedAt: Date;
    campaign: { name: string } | null;
    contact: {
      name: string;
      organization: string | null;
      channels: Array<{ platform: string; value: string; isPrimary: boolean }>;
    };
    status: { name: string; bucket: string; color: string };
    tags: Array<{ tag: { id: string; name: string } }>;
    activities: Array<{ type: string; happenedAt: Date }>;
  };
};

export function ThreadCard({ thread }: ThreadCardProps) {
  const primaryChannel =
    thread.contact.channels.find((channel) => channel.isPrimary) ??
    thread.contact.channels[0];

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="retro-window retro-pattern group block overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="retro-titlebar flex flex-wrap items-start justify-between gap-4 px-5 py-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              color={thread.status.color}
              label={thread.status.name}
              bucket={thread.status.bucket}
            />
            <span className="border border-white/70 bg-white/18 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
              {thread.platform}
            </span>
            <span className="border border-white/70 bg-white/18 px-3 py-1 text-xs font-bold text-white">
              Priority {thread.priority}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white">
              {thread.title}
            </h3>
            <p className="mt-1 text-sm text-white/86">
              {thread.contact.name}
              {thread.contact.organization ? ` · ${thread.contact.organization}` : ""}
              {thread.campaign ? ` · ${thread.campaign.name}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.16em] text-white/84">
          <div>Updated {formatDate(thread.updatedAt)}</div>
          <div className="mt-1">
            Follow-up {formatDate(thread.nextFollowUpAt)}
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm leading-6 text-[#314775]">
          {thread.summary ||
            "No summary yet. Open the thread to add context, notes, and replies."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#39507f]">
          <span className="border border-[#95abda] bg-white/72 px-3 py-1">
            Contact lane: {thread.platformIdentity || primaryChannel?.value || "Not set"}
          </span>
          <span className="border border-[#95abda] bg-white/72 px-3 py-1">
            Last event:{" "}
            {thread.activities[0]
              ? `${thread.activities[0].type} on ${formatDate(thread.activities[0].happenedAt)}`
              : "None yet"}
          </span>
        </div>

        {thread.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {thread.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="border border-[#86a3eb] bg-[linear-gradient(180deg,#65e7ff_0%,#36ccff_100%)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#13376d]"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
