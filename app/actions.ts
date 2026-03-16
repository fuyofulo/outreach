"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";

import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_THREAD_PRIORITY } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  numberValue,
  normalizeStatusColor,
  parseDateInput,
  parseMetadata,
  parseTags,
  slugify,
  textValue,
} from "@/lib/utils";

async function getOrCreateCampaign({
  campaignId,
  newCampaignName,
  description,
  objective,
  metadata,
}: {
  campaignId: string | null;
  newCampaignName: string | null;
  description?: string | null;
  objective?: string | null;
  metadata?: Prisma.InputJsonValue | typeof Prisma.DbNull;
}) {
  if (campaignId) {
    return prisma.campaign.findUnique({
      where: { id: campaignId },
    });
  }

  if (!newCampaignName) {
    return null;
  }

  const slugBase = slugify(newCampaignName) || `campaign-${Date.now()}`;
  const existing = await prisma.campaign.findUnique({
    where: { slug: slugBase },
  });

  if (existing) {
    return existing;
  }

  return prisma.campaign.create({
    data: {
      name: newCampaignName,
      slug: slugBase,
      description,
      objective,
      metadata,
    },
  });
}

async function getOrCreateTags(names: string[]) {
  if (!names.length) {
    return [];
  }

  const tags = [];

  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tags.push(tag);
  }

  return tags;
}

async function resolveStatus(statusId: string | null, statusName: string | null) {
  if (statusId) {
    const status = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (status) {
      return status;
    }
  }

  if (statusName) {
    const slug = slugify(statusName);
    const status = await prisma.status.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: statusName, mode: "insensitive" } }],
      },
    });

    if (status) {
      return status;
    }
  }

  return prisma.status.findFirst({
    where: { isDefault: true },
    orderBy: { position: "asc" },
  });
}

async function getDefaultThreadPlatform() {
  const platform = await prisma.threadPlatform.findFirst({
    orderBy: [{ name: "asc" }],
  });

  return platform?.name ?? "email";
}

async function connectTagsToThread(threadId: string, tagNames: string[]) {
  await prisma.threadTag.deleteMany({
    where: { threadId },
  });

  const tags = await getOrCreateTags(tagNames);
  if (!tags.length) {
    return;
  }

  await prisma.threadTag.createMany({
    data: tags.map((tag) => ({
      threadId,
      tagId: tag.id,
    })),
    skipDuplicates: true,
  });
}

async function refreshLastActivity(threadId: string) {
  const latestActivity = await prisma.activity.findFirst({
    where: { threadId },
    orderBy: { happenedAt: "desc" },
  });

  await prisma.thread.update({
    where: { id: threadId },
    data: {
      lastActivityAt: latestActivity?.happenedAt ?? null,
    },
  });
}

function statusClosedAt(bucket: string) {
  return bucket === "open" ? null : new Date();
}

function inferStatusBucket(name: string) {
  const slug = slugify(name);

  if (slug.includes("won")) {
    return "won";
  }

  if (slug.includes("lost")) {
    return "lost";
  }

  if (slug.includes("closed")) {
    return "closed";
  }

  return "open";
}

function jsonValue(raw: FormDataEntryValue | string | null | undefined) {
  const parsed = parseMetadata(raw);
  return parsed ? (parsed as Prisma.InputJsonValue) : Prisma.DbNull;
}

function activityMetadataValue(formData: FormData, noteFieldName: string, metadataFieldName?: string) {
  const note = textValue(formData.get(noteFieldName));
  const parsedMetadata = metadataFieldName
    ? parseMetadata(formData.get(metadataFieldName))
    : null;

  if (!note && !parsedMetadata) {
    return Prisma.DbNull;
  }

  return {
    ...(parsedMetadata ?? {}),
    ...(note ? { note } : {}),
  } as Prisma.InputJsonValue;
}

async function syncDirectoryContactChannels(contactId: string, formData: FormData) {
  const managesEmail = formData.has("email");
  const managesX = formData.has("xHandle") || formData.has("x");

  if (!managesEmail && !managesX) {
    return;
  }

  const existingChannels = await prisma.contactChannel.findMany({
    where: { contactId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  const currentPrimary = existingChannels.find((channel) => channel.isPrimary);
  const desiredByPlatform = new Map<string, string | null>();

  if (managesEmail) {
    desiredByPlatform.set("email", textValue(formData.get("email")));
  }

  if (managesX) {
    desiredByPlatform.set(
      "x",
      textValue(formData.get("xHandle")) ?? textValue(formData.get("x")),
    );
  }

  for (const [platform, value] of desiredByPlatform.entries()) {
    const matchingChannels = existingChannels.filter(
      (channel) => channel.platform === platform,
    );
    const primaryMatch = matchingChannels.find((channel) => channel.isPrimary);
    const channelToKeep = primaryMatch ?? matchingChannels[0];

    if (!value) {
      if (matchingChannels.length) {
        await prisma.contactChannel.deleteMany({
          where: {
            id: {
              in: matchingChannels.map((channel) => channel.id),
            },
          },
        });
      }
      continue;
    }

    const shouldBePrimary =
      !currentPrimary || currentPrimary.platform === platform || !existingChannels.length;

    if (channelToKeep) {
      await prisma.contactChannel.update({
        where: { id: channelToKeep.id },
        data: {
          value,
          label: platform === "email" ? "Email" : "X",
          url: null,
          isPrimary: channelToKeep.isPrimary || shouldBePrimary,
        },
      });

      const extraIds = matchingChannels
        .filter((channel) => channel.id !== channelToKeep.id)
        .map((channel) => channel.id);

      if (extraIds.length) {
        await prisma.contactChannel.deleteMany({
          where: {
            id: {
              in: extraIds,
            },
          },
        });
      }

      continue;
    }

    await prisma.contactChannel.create({
      data: {
        contactId,
        platform,
        value,
        label: platform === "email" ? "Email" : "X",
        url: null,
        isPrimary: shouldBePrimary,
      },
    });
  }

  const remainingChannels = await prisma.contactChannel.findMany({
    where: { contactId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  if (remainingChannels.length && !remainingChannels.some((channel) => channel.isPrimary)) {
    await prisma.contactChannel.update({
      where: { id: remainingChannels[0].id },
      data: { isPrimary: true },
    });
  }
}

export async function createThreadAction(formData: FormData) {
  const title = textValue(formData.get("title"));
  const existingContactId = textValue(formData.get("existingContactId"));
  const platform = textValue(formData.get("platform")) ?? (await getDefaultThreadPlatform());

  if (!existingContactId || !title) {
    redirect("/threads/new?error=missing-required-fields");
  }

  const campaign = await getOrCreateCampaign({
    campaignId: textValue(formData.get("campaignId")),
    newCampaignName: textValue(formData.get("newCampaignName")),
    description: textValue(formData.get("campaignDescription")),
    objective: textValue(formData.get("campaignObjective")),
    metadata: jsonValue(formData.get("campaignMetadata")),
  });
  const status = await resolveStatus(
    textValue(formData.get("statusId")),
    textValue(formData.get("statusName")),
  );

  if (!status) {
    redirect("/threads/new?error=no-status");
  }

  const contact = await prisma.contact.findUnique({
    where: { id: existingContactId },
  });

  if (!contact) {
    redirect("/threads/new?error=missing-contact");
  }

  const thread = await prisma.thread.create({
    data: {
      title,
      summary: textValue(formData.get("summary")),
      platform,
      platformIdentity: textValue(formData.get("platformIdentity")),
      priority: numberValue(formData.get("priority"), DEFAULT_THREAD_PRIORITY),
      nextFollowUpAt: parseDateInput(formData.get("nextFollowUpAt")),
      metadata: jsonValue(formData.get("threadMetadata")),
      campaignId: campaign?.id,
      contactId: contact.id,
      statusId: status.id,
      closedAt: statusClosedAt(status.bucket),
    },
  });

  const tagNames = parseTags(formData.get("tags"));
  await connectTagsToThread(thread.id, tagNames);

  const initialActivityContent = textValue(formData.get("initialActivityContent"));
  if (initialActivityContent) {
    await prisma.activity.create({
      data: {
        threadId: thread.id,
        type: textValue(formData.get("initialActivityType")) ?? "note",
        direction: textValue(formData.get("initialActivityDirection")),
        content: initialActivityContent,
        metadata: activityMetadataValue(formData, "initialActivityNote"),
        happenedAt:
          parseDateInput(formData.get("initialActivityAt")) ?? new Date(),
      },
    });
    await refreshLastActivity(thread.id);
  }

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/threads");
  redirect(`/threads/${thread.id}`);
}

export async function updateThreadAction(threadId: string, formData: FormData) {
  const currentThread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { status: true },
  });

  if (!currentThread) {
    redirect("/");
  }

  const campaign = await getOrCreateCampaign({
    campaignId: textValue(formData.get("campaignId")),
    newCampaignName: textValue(formData.get("newCampaignName")),
  });
  const status = await resolveStatus(
    textValue(formData.get("statusId")),
    textValue(formData.get("statusName")),
  );

  if (!status) {
    redirect(`/threads/${threadId}?error=no-status`);
  }

  await prisma.thread.update({
    where: { id: threadId },
    data: {
      title: textValue(formData.get("title")) ?? currentThread.title,
      summary: textValue(formData.get("summary")),
      platform: textValue(formData.get("platform")) ?? currentThread.platform,
      platformIdentity: textValue(formData.get("platformIdentity")),
      priority: numberValue(formData.get("priority"), currentThread.priority),
      nextFollowUpAt: parseDateInput(formData.get("nextFollowUpAt")),
      metadata: jsonValue(formData.get("threadMetadata")),
      campaignId: campaign?.id ?? null,
      statusId: status.id,
      closedAt: status.bucket === "open" ? null : currentThread.closedAt ?? new Date(),
    },
  });

  await connectTagsToThread(threadId, parseTags(formData.get("tags")));

  if (currentThread.statusId !== status.id) {
    await prisma.activity.create({
      data: {
        threadId,
        type: "status_change",
        direction: "internal",
        content: `Status moved from ${currentThread.status.name} to ${status.name}.`,
      },
    });
    await refreshLastActivity(threadId);
  }

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath("/contacts");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function deleteThreadAction(threadId: string) {
  await prisma.thread.delete({
    where: { id: threadId },
  });

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath("/contacts");
  redirect("/");
}

export async function updateContactAction(contactId: string, threadId: string, formData: FormData) {
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: textValue(formData.get("name")) ?? "Untitled contact",
      organization: textValue(formData.get("organization")),
      role: textValue(formData.get("role")),
      location: textValue(formData.get("location")),
      website: textValue(formData.get("website")),
      notes: textValue(formData.get("notes")),
      metadata: jsonValue(formData.get("contactMetadata")),
    },
  });

  await syncDirectoryContactChannels(contactId, formData);

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function saveContactAction(formData: FormData) {
  const contactId = textValue(formData.get("contactId"));
  const redirectTo = textValue(formData.get("redirectTo")) ?? "/contacts";
  const name = textValue(formData.get("name"));

  if (!name) {
    redirect("/contacts?error=missing-contact");
  }

  if (contactId) {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        name,
        organization: textValue(formData.get("organization")),
        notes: textValue(formData.get("notes")),
      },
    });

    await syncDirectoryContactChannels(contact.id, formData);

    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contact.id}`);
    revalidatePath("/threads");
    redirect(redirectTo);
  }

  const contact = await prisma.contact.create({
    data: {
      name,
      organization: textValue(formData.get("organization")),
      role: textValue(formData.get("role")),
      location: textValue(formData.get("location")),
      website: textValue(formData.get("website")),
      notes: textValue(formData.get("notes")),
      metadata: jsonValue(formData.get("contactMetadata")),
    },
  });

  await syncDirectoryContactChannels(contact.id, formData);

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contact.id}`);
  redirect(redirectTo);
}

export async function deleteContactAction(formData: FormData) {
  const contactId = textValue(formData.get("contactId"));
  const redirectTo = textValue(formData.get("redirectTo")) ?? "/contacts";

  if (!contactId) {
    redirect("/contacts?error=missing-contact");
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      _count: {
        select: {
          threads: true,
        },
      },
    },
  });

  if (!contact) {
    redirect("/contacts?error=contact-not-found");
  }

  if (contact._count.threads > 0) {
    redirect("/contacts?error=contact-in-use");
  }

  await prisma.contact.delete({
    where: { id: contact.id },
  });

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contact.id}`);
  redirect(redirectTo === `/contacts/${contact.id}` ? "/contacts" : redirectTo);
}

export async function addContactChannelAction(contactId: string, threadId: string, formData: FormData) {
  const platform = textValue(formData.get("platform"));
  const value = textValue(formData.get("value"));

  if (!platform || !value) {
    redirect(`/threads/${threadId}?error=missing-channel`);
  }

  if (formData.get("isPrimary") === "on") {
    await prisma.contactChannel.updateMany({
      where: { contactId },
      data: { isPrimary: false },
    });
  }

  await prisma.contactChannel.upsert({
    where: {
      contactId_platform_value: {
        contactId,
        platform,
        value,
      },
    },
    update: {
      label: textValue(formData.get("label")),
      url: textValue(formData.get("url")),
      isPrimary: formData.get("isPrimary") === "on",
    },
    create: {
      contactId,
      platform,
      value,
      label: textValue(formData.get("label")),
      url: textValue(formData.get("url")),
      isPrimary: formData.get("isPrimary") === "on",
    },
  });

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function deleteContactChannelAction(
  channelId: string,
  threadId: string,
) {
  await prisma.contactChannel.delete({
    where: { id: channelId },
  });

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function addActivityAction(threadId: string, formData: FormData) {
  const content = textValue(formData.get("content"));
  if (!content) {
    redirect(`/threads/${threadId}?error=missing-activity`);
  }

  const activity = await prisma.activity.create({
    data: {
      threadId,
      type: textValue(formData.get("type")) ?? "note",
      direction: textValue(formData.get("direction")),
      content,
      happenedAt: parseDateInput(formData.get("happenedAt")) ?? new Date(),
      metadata: activityMetadataValue(formData, "note", "metadata"),
    },
  });

  await prisma.thread.update({
    where: { id: threadId },
    data: {
      lastActivityAt: activity.happenedAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function deleteActivityAction(activityId: string, threadId: string) {
  await prisma.activity.delete({
    where: { id: activityId },
  });

  await refreshLastActivity(threadId);
  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function saveCampaignAction(formData: FormData) {
  const campaignId = textValue(formData.get("campaignId"));
  const redirectTo = textValue(formData.get("redirectTo")) ?? "/campaigns";
  const name = textValue(formData.get("name"));

  if (!name) {
    redirect("/campaigns?error=missing-campaign");
  }

  if (campaignId) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        description: textValue(formData.get("description")),
        objective: textValue(formData.get("objective")),
        status: textValue(formData.get("status")) ?? "active",
      },
    });

    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath("/threads");
    revalidatePath("/threads/new");
    redirect(redirectTo);
  }

  const slugBase = slugify(name) || `campaign-${Date.now()}`;
  const existing = await prisma.campaign.findUnique({
    where: { slug: slugBase },
  });

  await prisma.campaign.create({
    data: {
      name,
      slug: existing ? `${slugBase}-${Date.now()}` : slugBase,
      description: textValue(formData.get("description")),
      objective: textValue(formData.get("objective")),
      status: textValue(formData.get("status")) ?? "active",
    },
  });

  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath("/threads");
  revalidatePath("/threads/new");
  redirect(redirectTo);
}

export async function deleteCampaignAction(formData: FormData) {
  const campaignId = textValue(formData.get("campaignId"));

  if (!campaignId) {
    redirect("/campaigns?error=campaign-not-found");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      _count: {
        select: {
          threads: true,
        },
      },
    },
  });

  if (!campaign) {
    redirect("/campaigns?error=campaign-not-found");
  }

  if (campaign._count.threads > 0) {
    redirect("/campaigns?error=campaign-in-use");
  }

  await prisma.campaign.delete({
    where: { id: campaign.id },
  });

  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath("/threads");
  revalidatePath("/threads/new");
  redirect("/campaigns");
}

export async function addCampaignAction(formData: FormData) {
  return saveCampaignAction(formData);
}

export async function createContactAction(formData: FormData) {
  return saveContactAction(formData);
}

export async function addThreadPlatformAction(formData: FormData) {
  const name = textValue(formData.get("name"));
  if (!name) {
    redirect("/settings?error=missing-platform");
  }

  const slug = slugify(name) || `platform-${Date.now()}`;

  await prisma.threadPlatform.upsert({
    where: { slug },
    update: {
      name,
    },
    create: {
      name,
      slug,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/threads");
  revalidatePath("/threads/new");
  redirect("/settings");
}

export async function deleteThreadPlatformAction(platformId: string) {
  const platform = await prisma.threadPlatform.findUnique({
    where: { id: platformId },
  });

  if (!platform) {
    redirect("/settings?error=platform-not-found");
  }

  const threadCount = await prisma.thread.count({
    where: { platform: platform.name },
  });

  if (threadCount > 0) {
    redirect("/settings?error=platform-in-use");
  }

  await prisma.threadPlatform.delete({
    where: { id: platform.id },
  });

  revalidatePath("/settings");
  revalidatePath("/threads");
  revalidatePath("/threads/new");
  redirect("/settings");
}

export async function addStatusAction(formData: FormData) {
  const name = textValue(formData.get("name"));
  if (!name) {
    redirect("/settings?error=missing-status");
  }

  const slug = slugify(name) || `status-${Date.now()}`;
  const isDefault = formData.get("isDefault") === "on";
  const maxPosition = await prisma.status.aggregate({
    _max: {
      position: true,
    },
  });
  const nextPosition = (maxPosition._max.position ?? 0) + 10;

  if (isDefault) {
    await prisma.status.updateMany({
      data: { isDefault: false },
    });
  }

  await prisma.status.upsert({
    where: { slug },
    update: {
      bucket: inferStatusBucket(name),
      color: normalizeStatusColor(textValue(formData.get("color"))),
      position: nextPosition,
      isDefault,
    },
    create: {
      name,
      slug,
      bucket: inferStatusBucket(name),
      color: normalizeStatusColor(textValue(formData.get("color"))),
      position: nextPosition,
      isDefault,
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/threads/new");
  redirect("/settings");
}

export async function deleteStatusAction(statusId: string) {
  const [status, totalStatuses] = await Promise.all([
    prisma.status.findUnique({
      where: { id: statusId },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    }),
    prisma.status.count(),
  ]);

  if (!status) {
    redirect("/settings?error=status-not-found");
  }

  if (status._count.threads > 0) {
    redirect("/settings?error=status-in-use");
  }

  if (totalStatuses <= 1) {
    redirect("/settings?error=last-status");
  }

  if (status.isDefault) {
    const nextDefault = await prisma.status.findFirst({
      where: {
        id: { not: status.id },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    if (nextDefault) {
      await prisma.status.update({
        where: { id: nextDefault.id },
        data: { isDefault: true },
      });
    }
  }

  await prisma.status.delete({
    where: { id: status.id },
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/threads/new");
  redirect("/settings");
}

export async function importThreadsAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    redirect("/settings?error=missing-file");
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const defaultStatus = await prisma.status.findFirst({
    where: { isDefault: true },
    orderBy: { position: "asc" },
  });

  if (!defaultStatus) {
    redirect("/settings?error=no-status");
  }

  let imported = 0;

  for (const row of parsed.data) {
    const title = row.title?.trim();
    const contactName = row.contactName?.trim();

    if (!title || !contactName) {
      continue;
    }

    const campaign = row.campaign
      ? await getOrCreateCampaign({
          campaignId: null,
          newCampaignName: row.campaign.trim(),
          description: row.campaignDescription?.trim() || null,
          objective: row.campaignObjective?.trim() || null,
          metadata: jsonValue(row.campaignMetadata),
        })
      : null;

    const status = await resolveStatus(null, row.status?.trim() || null);
    const contact = await prisma.contact.create({
      data: {
        name: contactName,
        organization: row.organization?.trim() || null,
        role: row.role?.trim() || null,
        location: row.location?.trim() || null,
        website: row.website?.trim() || null,
        notes: row.contactNotes?.trim() || null,
        metadata: jsonValue(row.contactMetadata),
        channels:
          row.channelPlatform && row.channelValue
            ? {
                create: {
                  platform: row.channelPlatform.trim(),
                  value: row.channelValue.trim(),
                  label: row.channelLabel?.trim() || null,
                  url: row.channelUrl?.trim() || null,
                  isPrimary: true,
                },
              }
            : undefined,
      },
    });

    const thread = await prisma.thread.create({
      data: {
        title,
        summary: row.summary?.trim() || null,
        platform: row.platform?.trim() || (await getDefaultThreadPlatform()),
        platformIdentity: row.platformIdentity?.trim() || null,
        priority: numberValue(row.priority, DEFAULT_THREAD_PRIORITY),
        nextFollowUpAt: parseDateInput(row.nextFollowUpAt),
        metadata: jsonValue(row.threadMetadata),
        campaignId: campaign?.id ?? null,
        contactId: contact.id,
        statusId: status?.id ?? defaultStatus.id,
        closedAt: statusClosedAt(status?.bucket ?? defaultStatus.bucket),
      },
    });

    await connectTagsToThread(thread.id, parseTags(row.tags));

    if (row.initialActivityContent?.trim()) {
      await prisma.activity.create({
        data: {
          threadId: thread.id,
          type: row.initialActivityType?.trim() || "note",
          direction: row.initialActivityDirection?.trim() || null,
          content: row.initialActivityContent.trim(),
          happenedAt: parseDateInput(row.initialActivityAt) ?? new Date(),
          metadata: jsonValue(row.initialActivityMetadata),
        },
      });
      await refreshLastActivity(thread.id);
    }

    imported += 1;
  }

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath("/contacts");
  redirect(`/settings?imported=${imported}`);
}
