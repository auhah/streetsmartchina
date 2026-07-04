import type { DateOnly } from "@/content/content-loader";

type LastVerifiedBadgeProps = {
  date: DateOnly;
};

const formatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function LastVerifiedBadge({ date }: LastVerifiedBadgeProps) {
  return (
    <p className="verified-badge">
      <span aria-hidden="true" className="verified-badge__dot" />
      Last verified {formatter.format(new Date(`${date}T00:00:00.000Z`))}
    </p>
  );
}
