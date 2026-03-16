import { metadataToText } from "@/lib/utils";

export function csvRowFromThread(thread: {
  title: string;
  summary: string | null;
  platform: string;
  platformIdentity: string | null;
  priority: number;
  nextFollowUpAt: Date | null;
  metadata: unknown;
  campaign: {
    name: string;
    description: string | null;
    objective: string | null;
    metadata: unknown;
  } | null;
  contact: {
    name: string;
    organization: string | null;
    role: string | null;
    location: string | null;
    website: string | null;
    notes: string | null;
    metadata: unknown;
    channels: Array<{
      platform: string;
      value: string;
      label: string | null;
      url: string | null;
      isPrimary: boolean;
    }>;
  };
  status: { name: string };
  tags: Array<{ tag: { name: string } }>;
  activities: Array<{
    type: string;
    direction: string | null;
    content: string;
    happenedAt: Date;
    metadata: unknown;
  }>;
}) {
  const primaryChannel =
    thread.contact.channels.find((channel) => channel.isPrimary) ??
    thread.contact.channels[0];
  const initialActivity = thread.activities[0];

  return {
    title: thread.title,
    summary: thread.summary ?? "",
    campaign: thread.campaign?.name ?? "",
    campaignDescription: thread.campaign?.description ?? "",
    campaignObjective: thread.campaign?.objective ?? "",
    campaignMetadata: metadataToText(thread.campaign?.metadata),
    platform: thread.platform,
    platformIdentity: thread.platformIdentity ?? "",
    priority: thread.priority,
    nextFollowUpAt: thread.nextFollowUpAt?.toISOString() ?? "",
    status: thread.status.name,
    contactName: thread.contact.name,
    organization: thread.contact.organization ?? "",
    role: thread.contact.role ?? "",
    location: thread.contact.location ?? "",
    website: thread.contact.website ?? "",
    contactNotes: thread.contact.notes ?? "",
    contactMetadata: metadataToText(thread.contact.metadata),
    channelPlatform: primaryChannel?.platform ?? "",
    channelValue: primaryChannel?.value ?? "",
    channelLabel: primaryChannel?.label ?? "",
    channelUrl: primaryChannel?.url ?? "",
    tags: thread.tags.map(({ tag }) => tag.name).join(", "),
    threadMetadata: metadataToText(thread.metadata),
    initialActivityType: initialActivity?.type ?? "",
    initialActivityDirection: initialActivity?.direction ?? "",
    initialActivityContent: initialActivity?.content ?? "",
    initialActivityAt: initialActivity?.happenedAt.toISOString() ?? "",
    initialActivityMetadata: metadataToText(initialActivity?.metadata),
  };
}
