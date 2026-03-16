"use client";

import { useState } from "react";

export function CopyValueButton({
  value,
  emptyLabel = "",
}: {
  value: string;
  emptyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span>{emptyLabel}</span>;
  }

  return (
    <button
      className="retro-link text-left"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      title={copied ? "Copied" : "Copy email"}
    >
      {copied ? "Copied" : value}
    </button>
  );
}

export function XHandleLink({
  value,
  emptyLabel = "",
}: {
  value: string;
  emptyLabel?: string;
}) {
  if (!value) {
    return <span>{emptyLabel}</span>;
  }

  const normalized = value.startsWith("@") ? value.slice(1) : value;

  return (
    <a
      className="retro-link"
      href={`https://x.com/${normalized}`}
      rel="noreferrer"
      target="_blank"
    >
      {value}
    </a>
  );
}
