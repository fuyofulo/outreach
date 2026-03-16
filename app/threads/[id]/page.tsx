import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import {
  addActivityAction,
  deleteActivityAction,
  deleteThreadAction,
  updateContactAction,
  updateThreadAction,
} from "@/app/actions";
import { ConversationViewport } from "@/components/conversation-viewport";
import { MessageComposerModal } from "@/components/message-composer-modal";
import { ThreadPopovers } from "@/components/thread-popovers";
import { Panel } from "@/components/ui";
import { getThreadPageData } from "@/lib/outreach-data";
import {
  dateInputValue,
  dateTimeInputValue,
  formatDate,
} from "@/lib/utils";

type ThreadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ThreadPage({ params }: ThreadPageProps) {
  noStore();

  const { id } = await params;
  const data = await getThreadPageData(id);

  if (!data) {
    notFound();
  }

  const { thread, statuses, campaigns, platforms } = data;
  const updateThread = updateThreadAction.bind(null, thread.id);
  const updateContact = updateContactAction.bind(null, thread.contact.id, thread.id);
  const deleteThread = deleteThreadAction.bind(null, thread.id);
  const email = thread.contact.channels.find((channel) => channel.platform === "email")?.value ?? "";
  const xHandle = thread.contact.channels.find((channel) => channel.platform === "x")?.value ?? "";
  const orderedActivities = [...thread.activities].sort(
    (a, b) => a.happenedAt.getTime() - b.happenedAt.getTime(),
  );

  return (
    <main className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <header className="retro-window flex-none overflow-hidden">
        <div className="retro-titlebar px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Thread</p>
        </div>
        <div className="retro-pattern flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0">
            <h1 className="hero-title truncate text-2xl font-black tracking-[-0.06em] text-[#112a63]">
              {thread.title}
            </h1>
            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-stone-600">
              {thread.contact.name}
              {thread.contact.organization ? ` · ${thread.contact.organization}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/threads" className="button-secondary">
              Back
            </Link>
            <MessageComposerModal
              contactName={thread.contact.name}
              action={addActivityAction.bind(null, thread.id)}
              happenedAt={dateTimeInputValue(new Date())}
            />
            <ThreadPopovers
              contactName={thread.contact.name}
              threadAction={updateThread}
              contactAction={updateContact}
              deleteAction={deleteThread}
              threadDefaults={{
                title: thread.title,
                platform: thread.platform,
                statusId: thread.statusId,
                campaignId: thread.campaignId ?? "",
                nextFollowUpAt: dateInputValue(thread.nextFollowUpAt),
                tags: thread.tags.map(({ tag }) => tag.name).join(", "),
                summary: thread.summary ?? "",
              }}
              statuses={statuses.map((status) => ({
                id: status.id,
                name: status.name,
              }))}
              campaigns={campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))}
              platforms={platforms.map((platform) => ({
                id: platform.id,
                name: platform.name,
              }))}
              contactDefaults={{
                name: thread.contact.name,
                organization: thread.contact.organization ?? "",
                email,
                xHandle,
                notes: thread.contact.notes ?? "",
              }}
            />
          </div>
        </div>
      </header>

      <Panel
        title="Conversation"
        className="flex min-h-0 flex-1 flex-col"
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        <ConversationViewport>
          <div className="space-y-0">
            {orderedActivities.length ? (
              orderedActivities.map((activity) => {
                const isOutbound = activity.direction === "outbound";
                const isInternal = activity.direction === "internal";
                const deleteActivity = deleteActivityAction.bind(
                  null,
                  activity.id,
                  thread.id,
                );
                const speaker = isInternal
                  ? "Note"
                  : isOutbound
                    ? "Me"
                    : thread.contact.name;

                return (
                  <div
                    key={activity.id}
                    className="border-b border-stone-950/10 py-3 last:border-b-0"
                  >
                    <div className={`flex ${isInternal ? "justify-center" : isOutbound ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] ${isOutbound ? "text-right" : isInternal ? "text-center" : "text-left"}`}>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                          <span className={isOutbound ? "ml-auto" : ""}>{speaker}</span>
                          <span className="font-normal normal-case tracking-normal text-stone-400">
                            {formatDate(activity.happenedAt, {
                              dateStyle: "medium",
                              timeStyle: "medium",
                            })}
                          </span>
                          <form action={deleteActivity}>
                            <button
                              className="button-danger !h-[20px] !w-auto px-2 !py-0 text-[9px] leading-none"
                              type="submit"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                        <div className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-5 text-stone-800">
                          {activity.content}
                        </div>
                        {messageNote(activity.metadata) ? (
                          <div className="mt-2 text-[11px] leading-4 text-stone-500">
                            Note: {messageNote(activity.metadata)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border-b border-stone-950/10 py-3 text-sm text-stone-600">
                No messages yet.
              </div>
            )}
          </div>
        </ConversationViewport>
      </Panel>
    </main>
  );
}

function messageNote(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const value = (metadata as Record<string, unknown>).note;
  return typeof value === "string" ? value : "";
}
