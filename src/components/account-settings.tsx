"use client";

import { useState } from "react";

import { AccountBinder } from "@/components/AccountBinder";
import { useIdentity } from "@/components/identity-provider";

type AccountSettingsProps = {
  open?: boolean;
  onClose?: () => void;
  variant?: "panel" | "modal";
  onChange?: (accountId: number | null) => void;
};

/** Thin settings shell around AccountBinder (panel or modal). */
export function AccountSettings({
  open = true,
  onClose,
  variant = "panel",
  onChange,
}: AccountSettingsProps) {
  if (!open) return null;

  const body = <AccountBinder onChange={onChange} />;

  if (variant === "modal") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Steam account settings"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="w-full max-w-md">
          {body}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return body;
}

/** Tiny header control: open Set / Change account modal. */
export function AccountSettingsEntry() {
  const { accountId, hydrated, profile } = useIdentity();
  const [open, setOpen] = useState(false);

  const label = !hydrated
    ? "Account…"
    : accountId == null
      ? "Set Steam ID"
      : profile?.personaname
        ? `Change account (${profile.personaname})`
        : "Change account";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
      >
        {label}
      </button>
      <AccountSettings
        variant="modal"
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
