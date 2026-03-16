"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { deleteCampaignAction, saveCampaignAction } from "@/app/actions";

type CampaignModalProps = {
  campaign?: {
    id: string;
    name: string;
    objective: string | null;
    description: string | null;
    status: string;
  };
  triggerLabel?: string;
  triggerClassName?: string;
};

export function CampaignModal({
  campaign,
  triggerLabel,
  triggerClassName,
}: CampaignModalProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isEditing = Boolean(campaign);

  return (
    <>
      <button
        className={triggerClassName ?? "button-primary"}
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel ?? (isEditing ? "Edit" : "Add campaign")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4">
          <div className="retro-window w-full max-w-lg overflow-hidden">
            <div className="retro-titlebar flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                {isEditing ? "Edit campaign" : "Add campaign"}
              </span>
              <button
                className="button-secondary !w-auto px-3 py-1.5"
                type="button"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="retro-pattern p-3">
              <form action={saveCampaignAction} className="space-y-3">
                {campaign ? (
                  <input type="hidden" name="campaignId" value={campaign.id} />
                ) : null}
                <input type="hidden" name="redirectTo" value={pathname} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="label">Name</span>
                    <input
                      className="field"
                      name="name"
                      defaultValue={campaign?.name ?? ""}
                      placeholder="2026 job search"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="label">Objective</span>
                    <input
                      className="field"
                      name="objective"
                      defaultValue={campaign?.objective ?? ""}
                      placeholder="Get more job conversations"
                    />
                  </label>
                  <label className="block">
                    <span className="label">Status</span>
                    <select
                      className="field"
                      name="status"
                      defaultValue={campaign?.status ?? "active"}
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="done">done</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="label">Description</span>
                  <textarea
                    className="field min-h-20"
                    name="description"
                    defaultValue={campaign?.description ?? ""}
                  />
                </label>
                <button className="button-primary w-full" type="submit">
                  Save campaign
                </button>
              </form>

              {campaign ? (
                <form action={deleteCampaignAction} className="mt-2">
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <input type="hidden" name="redirectTo" value={pathname} />
                  <button className="button-danger w-full" type="submit">
                    Delete campaign
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
