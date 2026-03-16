import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { ContactModal } from "@/components/contact-modal";
import { CopyValueButton, XHandleLink } from "@/components/contact-value-actions";
import { EmptyState, Field, PageHeader, Panel } from "@/components/ui";
import { getContactsPageData } from "@/lib/outreach-data";

type ContactsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  noStore();

  const resolvedSearchParams = (await searchParams) ?? {};
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : null;
  const { contacts } = await getContactsPageData(q);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Contacts"
        title="Contacts"
        actions={
          <>
            <ContactModal triggerLabel="New contact" />
          </>
        }
      />

      {error ? (
        <p className="mb-4 border border-stone-950/10 bg-white/76 px-3 py-2 text-sm text-stone-700">
          Action failed: {error.replaceAll("-", " ")}.
        </p>
      ) : null}

      <Panel title="Directory" className="flex min-h-0 flex-1 flex-col" bodyClassName="flex min-h-0 flex-1 flex-col p-0">
        <form className="mb-0 flex flex-wrap items-end gap-2 border-b border-stone-950/8 p-3">
          <Field label="Search">
            <input
              className="field w-[220px]"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Jane Doe, Acme..."
            />
          </Field>
          <button className="button-primary !w-auto" type="submit">
            Search
          </button>
          <Link href="/contacts" className="button-secondary !w-auto">
            Reset
          </Link>
        </form>

        {contacts.length ? (
          <div className="min-h-0 flex-1 overflow-auto border-y border-stone-950/8 bg-white/86">
            <table className="w-full border-collapse text-[11px] md:text-xs">
              <thead className="bg-stone-950/6 text-left uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="w-[210px] border border-stone-950/8 px-2 py-1.5">Name</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Org</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Email</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">X</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Contacted?</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Notes</th>
                  <th className="border border-stone-950/8 px-2 py-1.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => {
                  const email =
                    contact.channels.find((channel) => channel.platform === "email")
                      ?.value ?? "";
                  const xHandle =
                    contact.channels.find((channel) => channel.platform === "x")
                      ?.value ?? "";
                  const modalContact = {
                    id: contact.id,
                    name: contact.name,
                    organization: contact.organization,
                    email,
                    xHandle,
                    notes: contact.notes,
                  };

                  return (
                    <tr key={contact.id} className="align-top">
                      <td className="w-[210px] border border-stone-950/8 px-2 py-1.5 font-semibold text-stone-950">
                        <Link href={`/contacts/${contact.id}`} className="retro-link font-semibold">
                          {contact.name}
                        </Link>
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {contact.organization || ""}
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        <CopyValueButton value={email} />
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        <XHandleLink value={xHandle} />
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        {contact._count.threads > 0 ? "Yes" : "No"}
                      </td>
                      <td
                        className="border border-stone-950/8 px-2 py-1.5 text-stone-700"
                        title={contact.notes ?? ""}
                      >
                        <div className="max-w-[26ch] truncate">{contact.notes || ""}</div>
                      </td>
                      <td className="border border-stone-950/8 px-2 py-1.5 text-stone-700">
                        <div className="flex flex-wrap gap-2">
                          <ContactModal
                            contact={modalContact}
                            triggerLabel="Edit"
                            triggerClassName="button-secondary !w-auto px-3 py-1.5"
                          />
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="button-secondary !w-auto px-3 py-1.5"
                          >
                            Open thread
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No contacts yet." />
        )}
      </Panel>
    </main>
  );
}
