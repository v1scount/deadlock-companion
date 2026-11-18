import { LiveMatchView } from "@/components/LiveMatchView";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.account) ? params.account[0] : params.account;
  const accountId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  return <LiveMatchView focusAccountId={accountId} />;
}