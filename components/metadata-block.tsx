import { metadataToText } from "@/lib/utils";

export function MetadataBlock({
  value,
  emptyLabel,
}: {
  value: unknown;
  emptyLabel: string;
}) {
  const text = metadataToText(value);

  return (
    <div className="border border-[#6d83ba] border-t-white border-l-white border-r-[#4e6393] border-b-[#4e6393] bg-[linear-gradient(180deg,#ffffff_0%,#dde7fb_100%)] p-4">
      <p className="label">Metadata</p>
      <p className="metadata-box font-mono text-sm leading-6 text-[#304775]">
        {text || emptyLabel}
      </p>
    </div>
  );
}
