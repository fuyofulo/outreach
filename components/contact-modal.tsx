"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { deleteContactAction, saveContactAction } from "@/app/actions";

type ContactModalProps = {
  contact?: {
    id: string;
    name: string;
    organization: string | null;
    email: string;
    xHandle: string;
    notes: string | null;
  };
  triggerLabel?: string;
  triggerClassName?: string;
};

export function ContactModal({
  contact,
  triggerLabel,
  triggerClassName,
}: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isEditing = Boolean(contact);

  return (
    <>
      <button
        className={triggerClassName ?? "button-primary"}
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel ?? (isEditing ? "Edit" : "New contact")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4">
          <div className="retro-window w-full max-w-lg overflow-hidden">
            <div className="retro-titlebar flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                {isEditing ? "Edit contact" : "New contact"}
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
              <form action={saveContactAction} className="space-y-3">
                {contact ? <input type="hidden" name="contactId" value={contact.id} /> : null}
                <input type="hidden" name="redirectTo" value={pathname} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Name</span>
                    <input
                      className="field"
                      name="name"
                      defaultValue={contact?.name ?? ""}
                      placeholder="Jane Doe"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="label">Org</span>
                    <input
                      className="field"
                      name="organization"
                      defaultValue={contact?.organization ?? ""}
                      placeholder="Acme"
                    />
                  </label>
                  <label className="block">
                    <span className="label">Email</span>
                    <input
                      className="field"
                      name="email"
                      defaultValue={contact?.email ?? ""}
                      placeholder="jane@company.com"
                    />
                  </label>
                  <label className="block">
                    <span className="label">X</span>
                    <input
                      className="field"
                      name="xHandle"
                      defaultValue={contact?.xHandle ?? ""}
                      placeholder="@janedoe"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Notes</span>
                  <textarea
                    className="field min-h-20"
                    name="notes"
                    defaultValue={contact?.notes ?? ""}
                  />
                </label>
                <button className="button-primary w-full" type="submit">
                  Save contact
                </button>
              </form>

              {contact ? (
                <form action={deleteContactAction} className="mt-2">
                  <input type="hidden" name="contactId" value={contact.id} />
                  <input type="hidden" name="redirectTo" value={pathname} />
                  <button className="button-danger w-full" type="submit">
                    Delete contact
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
