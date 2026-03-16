import { prisma } from "@/lib/prisma";

export type Filters = {
  q?: string;
  platform?: string;
  statusId?: string;
  campaignId?: string;
  due?: string;
};

function buildThreadWhere(filters: Filters) {
  return {
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.statusId ? { statusId: filters.statusId } : {}),
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.due === "1"
      ? {
          nextFollowUpAt: {
            lte: new Date(),
          },
          status: {
            bucket: "open",
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" as const } },
            { summary: { contains: filters.q, mode: "insensitive" as const } },
            {
              contact: {
                name: { contains: filters.q, mode: "insensitive" as const },
              },
            },
            {
              contact: {
                organization: {
                  contains: filters.q,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              campaign: {
                name: { contains: filters.q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
}

export async function getDashboardData() {
  const [
    totalThreads,
    dueThreadsCount,
    contactsCount,
    activeCampaigns,
    activitiesThisWeek,
    dueThreads,
    recentActivities,
    recentThreads,
    statuses,
    platformRows,
    campaignRows,
  ] = await Promise.all([
    prisma.thread.count(),
    prisma.thread.count({
      where: {
        nextFollowUpAt: { lte: new Date() },
        status: { bucket: "open" },
      },
    }),
    prisma.contact.count(),
    prisma.campaign.count({
      where: { status: "active" },
    }),
    prisma.activity.count({
      where: {
        happenedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.thread.findMany({
      where: {
        nextFollowUpAt: { lte: new Date() },
        status: { bucket: "open" },
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
      take: 6,
      include: {
        campaign: true,
        contact: true,
        status: true,
      },
    }),
    prisma.activity.findMany({
      orderBy: { happenedAt: "desc" },
      take: 8,
      include: {
        thread: {
          include: {
            contact: true,
          },
        },
      },
    }),
    prisma.thread.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      include: {
        campaign: true,
        contact: {
          include: {
            channels: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
          },
        },
        status: true,
        tags: {
          include: {
            tag: true,
          },
        },
        activities: {
          orderBy: { happenedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.status.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    }),
    prisma.thread.groupBy({
      by: ["platform"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          platform: "desc",
        },
      },
    }),
    prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    }),
  ]);

  return {
    metrics: {
      totalThreads,
      dueThreads: dueThreadsCount,
      contacts: contactsCount,
      activeCampaigns,
      activitiesThisWeek,
    },
    dueThreads,
    recentActivities,
    recentThreads,
    statuses,
    platformRows,
    campaignRows,
  };
}

export async function getThreadFormData(contactId?: string) {
  const [statuses, campaigns, contacts, selectedContact, platforms] = await Promise.all([
    prisma.status.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.campaign.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        channels: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: {
            threads: true,
          },
        },
      },
    }),
    contactId
      ? prisma.contact.findUnique({
          where: { id: contactId },
          include: {
            channels: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
            _count: {
              select: {
                threads: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    prisma.threadPlatform.findMany({
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return { statuses, campaigns, contacts, selectedContact, platforms };
}

export async function getThreadsPageData(filters: Filters) {
  const where = buildThreadWhere(filters);

  const [threads, statuses, campaigns, platforms] = await Promise.all([
    prisma.thread.findMany({
      where,
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
      include: {
        campaign: true,
        contact: {
          include: {
            channels: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
          },
        },
        status: true,
        tags: {
          include: {
            tag: true,
          },
        },
        activities: {
          orderBy: { happenedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.status.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.campaign.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.threadPlatform.findMany({
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return { threads, statuses, campaigns, platforms };
}

export async function getContactsPageData(search: string | undefined) {
  const contacts = await prisma.contact.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { organization: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
            {
              channels: {
                some: {
                  value: { contains: search, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: [{ name: "asc" }],
    include: {
      channels: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          threads: true,
        },
      },
    },
  });

  return { contacts };
}

export async function getContactPageData(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      channels: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          threads: true,
        },
      },
    },
  });

  if (!contact) {
    return null;
  }

  const [threads, activities] = await Promise.all([
    prisma.thread.findMany({
      where: { contactId },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        campaign: true,
        status: true,
        activities: {
          orderBy: { happenedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.activity.findMany({
      where: {
        thread: {
          contactId,
        },
      },
      orderBy: { happenedAt: "desc" },
      take: 40,
      include: {
        thread: {
          include: {
            campaign: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return { contact, threads, activities };
}

export async function getCampaignsPageData(search?: string) {
  const campaigns = await prisma.campaign.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { objective: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          threads: true,
        },
      },
    },
  });

  return { campaigns };
}

export async function getCampaignPageData(campaignId: string) {
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
    return null;
  }

  const threads = await prisma.thread.findMany({
    where: { campaignId },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      contact: true,
      status: true,
      activities: {
        orderBy: { happenedAt: "desc" },
        take: 1,
      },
    },
  });

  return { campaign, threads };
}

export async function getSettingsPageData() {
  const [statuses, platforms, totalThreads] = await Promise.all([
    prisma.status.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    }),
    prisma.threadPlatform.findMany({
      orderBy: [{ name: "asc" }],
    }),
    prisma.thread.count(),
  ]);

  return { statuses, platforms, totalThreads };
}

export async function getThreadPageData(threadId: string) {
  const [thread, statuses, campaigns, platforms] = await Promise.all([
    prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        campaign: true,
        contact: {
          include: {
            channels: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
          },
        },
        status: true,
        tags: {
          include: {
            tag: true,
          },
        },
        activities: {
          orderBy: {
            happenedAt: "desc",
          },
        },
      },
    }),
    prisma.status.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.campaign.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.threadPlatform.findMany({
      orderBy: [{ name: "asc" }],
    }),
  ]);

  if (!thread) {
    return null;
  }

  const relatedThreads = await prisma.thread.findMany({
    where: {
      contactId: thread.contactId,
      id: { not: thread.id },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
    include: {
      campaign: true,
      status: true,
    },
  });

  return { thread, statuses, campaigns, platforms, relatedThreads };
}

export async function getExportThreads(filters: Filters) {
  return prisma.thread.findMany({
    where: buildThreadWhere(filters),
    orderBy: { updatedAt: "desc" },
    include: {
      campaign: true,
      contact: {
        include: {
          channels: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      },
      status: true,
      tags: {
        include: {
          tag: true,
        },
      },
      activities: {
        orderBy: {
          happenedAt: "asc",
        },
        take: 1,
      },
    },
  });
}
