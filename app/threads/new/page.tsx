import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { createThreadAction } from "@/app/actions";
import { CustomSelect } from "@/components/custom-select";
import { ThreadNameCampaignFields } from "@/components/thread-name-campaign-fields";
import { Field, PageHeader, Panel } from "@/components/ui";
import { getThreadFormData } from "@/lib/outreach-data";

type NewThreadPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewThreadPage({ searchParams }: NewThreadPageProps) {
  noStore();

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedContactId =
    typeof resolvedSearchParams.contactId === "string"
      ? resolvedSearchParams.contactId
      : undefined;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : null;
  const { campaigns, contacts, selectedContact, platforms } = await getThreadFormData(
    selectedContactId,
  );
  const email = selectedContact?.channels.find((channel) => channel.platform === "email")?.value;
  const xHandle = selectedContact?.channels.find((channel) => channel.platform === "x")?.value;

  return (
    <main>
      <PageHeader eyebrow="Threads" title="New Thread" />

      {error ? (
        <p className="mb-4 border border-stone-950/10 bg-white/76 px-3 py-2 text-sm text-stone-700">
          Action failed: {error.replaceAll("-", " ")}.
        </p>
      ) : null}

      <Panel title="Conversation setup">
        <form action={createThreadAction} className="space-y-4">
          <ThreadNameCampaignFields
            campaigns={campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />

          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr]">
            <Field label="Contact">
              <CustomSelect
                name="existingContactId"
                defaultValue={selectedContact?.id ?? ""}
                options={[
                  { value: "", label: "Select a contact" },
                  ...contacts.map((contact) => ({
                    value: contact.id,
                    label: `${contact.name}${contact.organization ? ` · ${contact.organization}` : ""}`,
                  })),
                ]}
                placeholder="Select a contact"
              />
            </Field>
            <Field label="Platform">
              <CustomSelect
                name="platform"
                defaultValue={platforms[0]?.name ?? "email"}
                options={
                  platforms.length
                    ? platforms.map((platform) => ({
                        value: platform.name,
                        label: platform.name,
                      }))
                    : [{ value: "email", label: "email" }]
                }
              />
            </Field>
          </div>

          {selectedContact ? (
            <div className="border border-stone-950/8 bg-white/72 px-3 py-2 text-[11px] text-stone-700">
              {selectedContact.name}
              {selectedContact.organization ? ` · ${selectedContact.organization}` : ""}
              {email ? ` · ${email}` : ""}
              {xHandle ? ` · ${xHandle}` : ""}
            </div>
          ) : null}

          <Field label="Next follow-up">
            <input className="field" type="date" name="nextFollowUpAt" />
          </Field>

          {!selectedContact ? (
            <div className="border border-stone-950/8 bg-white/72 px-3 py-2 text-[11px] text-stone-700">
              Select a contact first. If the person is not in your directory yet, add them from{" "}
              <Link href="/contacts" className="font-semibold underline">
                Contacts
              </Link>
              .
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr]">
            <Field label="Tags">
              <input className="field" name="tags" placeholder="jobs, founder, follow-up" />
            </Field>
            <Field label="Thread notes">
              <input className="field" name="summary" placeholder="General notes for this conversation" />
            </Field>
          </div>

          <button className="button-primary w-full" type="submit">
            Create thread
          </button>
        </form>
      </Panel>
    </main>
  );
}
