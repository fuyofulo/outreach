"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/custom-select";

type MessageComposerModalProps = {
  contactName: string;
  action: (formData: FormData) => void | Promise<void>;
  happenedAt: string;
};

export function MessageComposerModal({
  contactName,
  action,
  happenedAt,
}: MessageComposerModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button-primary" type="button" onClick={() => setOpen(true)}>
        New message
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4">
          <div className="retro-window w-full max-w-xl overflow-hidden">
            <div className="retro-titlebar flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                New message
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
              <form action={action} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[0.9fr_1fr]">
                  <label className="block">
                    <span className="label">Speaker</span>
                    <CustomSelect
                      name="direction"
                      defaultValue="outbound"
                      options={[
                        { value: "outbound", label: "Me" },
                        { value: "inbound", label: contactName },
                      ]}
                    />
                  </label>
                  <label className="block">
                    <span className="label">When</span>
                    <input
                      className="field"
                      type="datetime-local"
                      name="happenedAt"
                      defaultValue={happenedAt}
                      step="1"
                    />
                  </label>
                </div>
                <input type="hidden" name="type" value="message" />
                <label className="block">
                  <span className="label">Message</span>
                  <textarea
                    className="field min-h-28"
                    name="content"
                    placeholder="Paste the message or reply."
                  />
                </label>
                <label className="block">
                  <span className="label">Message note</span>
                  <input className="field" name="note" placeholder="Optional note about this message" />
                </label>
                <button className="button-primary w-full" type="submit">
                  Add message
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
