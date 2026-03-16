"use client";

import { useEffect, useRef } from "react";

export function ConversationViewport({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, []);

  return (
    <div
      ref={viewportRef}
      className="retro-scroll h-full min-h-0 overflow-y-auto border-y border-stone-950/10 pl-0 pr-5"
    >
      {children}
    </div>
  );
}
