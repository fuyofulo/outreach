"use client";

import { useState } from "react";

type ThreadPopoversProps = {
  contactName: string;
  threadAction: (formData: FormData) => void | Promise<void>;
  contactAction: (formData: FormData) => void | Promise<void>;
  deleteAction: () => void | Promise<void>;
  threadDefaults: {
    title: string;
    platform: string;
    statusId: string;
    campaignId: string;
    nextFollowUpAt: string;
    tags: string;
    summary: string;
  };
  statuses: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; name: string }>;
  platforms: Array<{ id: string; name: string }>;
  contactDefaults: {
    name: string;
    organization: string;
    email: string;
    xHandle: string;
    notes: string;
  };
};

export function ThreadPopovers({
  contactName,
  threadAction,
  contactAction,
  deleteAction,
  threadDefaults,
  statuses,
  campaigns,
  platforms,
  contactDefaults,
}: ThreadPopoversProps) {
  const [open, setOpen] = useState<"thread" | "contact" | "delete" | null>(null);

  return (
    <>
      <button className="button-secondary" type="button" onClick={() => setOpen("thread")}>
        Thread
      </button>
      <button className="button-secondary" type="button" onClick={() => setOpen("contact")}>
        Contact
      </button>
      <button className="button-danger" type="button" onClick={() => setOpen("delete")}>
        Delete
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4">
          <div className="retro-window w-full max-w-xl overflow-hidden">
            <div className="retro-titlebar flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                {open === "thread" ? "Thread details" : open === "contact" ? contactName : "Delete thread"}
              </span>
              <button
                className="button-secondary !w-auto px-3 py-1.5"
                type="button"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
            <div className="retro-pattern p-3">
              {open === "thread" ? (
                <form action={threadAction} className="space-y-3">
                  <label className="block">
                    <span className="label">Thread name</span>
                    <input className="field" name="title" defaultValue={threadDefaults.title} required />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">Platform</span>
                      <select className="field" name="platform" defaultValue={threadDefaults.platform}>
                        {platforms.some((platform) => platform.name === threadDefaults.platform) ? null : (
                          <option value={threadDefaults.platform}>{threadDefaults.platform}</option>
                        )}
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.name}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="label">Status</span>
                      <select className="field" name="statusId" defaultValue={threadDefaults.statusId}>
                        {statuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="label">Campaign</span>
                      <select className="field" name="campaignId" defaultValue={threadDefaults.campaignId}>
                        <option value="">None</option>
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="label">Next follow-up</span>
                      <input
                        className="field"
                        type="date"
                        name="nextFollowUpAt"
                        defaultValue={threadDefaults.nextFollowUpAt}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="label">Tags</span>
                    <input className="field" name="tags" defaultValue={threadDefaults.tags} />
                  </label>
                  <label className="block">
                    <span className="label">Thread notes</span>
                    <textarea className="field min-h-24" name="summary" defaultValue={threadDefaults.summary} />
                  </label>
                  <button className="button-primary w-full" type="submit">
                    Save thread
                  </button>
                </form>
              ) : null}

              {open === "contact" ? (
                <form action={contactAction} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">Name</span>
                      <input className="field" name="name" defaultValue={contactDefaults.name} required />
                    </label>
                    <label className="block">
                      <span className="label">Org</span>
                      <input className="field" name="organization" defaultValue={contactDefaults.organization} />
                    </label>
                    <label className="block">
                      <span className="label">Email</span>
                      <input className="field" name="email" defaultValue={contactDefaults.email} />
                    </label>
                    <label className="block">
                      <span className="label">X</span>
                      <input className="field" name="xHandle" defaultValue={contactDefaults.xHandle} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="label">Notes</span>
                    <textarea className="field min-h-24" name="notes" defaultValue={contactDefaults.notes} />
                  </label>
                  <button className="button-primary w-full" type="submit">
                    Save contact
                  </button>
                </form>
              ) : null}

              {open === "delete" ? (
                <form action={deleteAction} className="space-y-3">
                  <p className="text-[12px] leading-5 text-stone-700">
                    Delete this thread for {contactName}?
                  </p>
                  <button className="button-danger w-full" type="submit">
                    Confirm delete
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
