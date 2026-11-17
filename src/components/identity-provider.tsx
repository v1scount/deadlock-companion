"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { fetchSteamProfile } from "@/lib/deadlock-api";
import {
  clearAccountId,
  getAccountId,
  hydrateAccountId,
  setAccountIdFromInputDetailed,
  subscribeAccountId,
  type SetAccountIdResult,
} from "@/lib/identity";
import type { SteamProfile } from "@/types/deadlock";

export type IdentityContextValue = {
  accountId: number | null;
  hydrated: boolean;
  profile: SteamProfile | null;
  profileStatus: "idle" | "loading" | "ready" | "missing" | "error";
  setFromInput: (raw: string) => Promise<SetAccountIdResult>;
  clear: () => void;
  refreshProfile: () => Promise<void>;
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

function useAccountIdStore(): { accountId: number | null; hydrated: boolean } {
  const accountId = useSyncExternalStore(
    subscribeAccountId,
    getAccountId,
    () => null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateAccountId();
    setHydrated(true);
  }, []);

  return { accountId, hydrated };
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { accountId, hydrated } = useAccountIdStore();
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [profileStatus, setProfileStatus] =
    useState<IdentityContextValue["profileStatus"]>("idle");

  const refreshProfile = useCallback(async () => {
    const id = getAccountId();
    if (id == null) {
      setProfile(null);
      setProfileStatus("idle");
      return;
    }
    setProfileStatus("loading");
    try {
      const next = await fetchSteamProfile(id);
      setProfile(next);
      setProfileStatus(next ? "ready" : "missing");
    } catch {
      setProfile(null);
      setProfileStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refreshProfile();
  }, [accountId, hydrated, refreshProfile]);

  const setFromInput = useCallback(async (raw: string) => {
    return setAccountIdFromInputDetailed(raw);
  }, []);

  const clear = useCallback(() => {
    clearAccountId();
    setProfile(null);
    setProfileStatus("idle");
  }, []);

  const value: IdentityContextValue = {
    accountId,
    hydrated,
    profile,
    profileStatus,
    setFromInput,
    clear,
    refreshProfile,
  };

  return (
    <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return ctx;
}
