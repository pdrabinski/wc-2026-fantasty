"use client";

import { useState } from "react";

type CopyInviteLinkProps = {
  href: string;
};

export function CopyInviteLink({ href }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleCopy}
        className="text-left text-base text-white underline decoration-white/35 underline-offset-4 transition hover:decoration-white"
        title="Click to copy invite link"
      >
        {href}
      </button>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        {copied ? "Copied" : "Click to copy"}
      </p>
    </div>
  );
}
