import { THREAT_META, type AbilityThreat } from "@/types/threat";

interface Props {
  threats: AbilityThreat[];
  /** Dense overlay on video vs inline chips. */
  placement?: "overlay" | "inline";
}

export function AbilityThreatBadges({
  threats,
  placement = "inline",
}: Props) {
  if (!threats.length) return null;

  const wrap =
    placement === "overlay"
      ? "pointer-events-none absolute left-1.5 top-1.5 z-10 flex max-w-[90%] flex-wrap gap-1"
      : "flex flex-wrap gap-1";

  return (
    <div className={wrap} aria-label="Threat tags">
      {threats.map((id) => {
        const meta = THREAT_META[id];
        return (
          <span
            key={id}
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md backdrop-blur-sm ${meta.className}`}
            title={meta.label}
          >
            {meta.mark}
          </span>
        );
      })}
    </div>
  );
}
