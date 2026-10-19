const yearOf = (context) =>
  typeof context === "number" ? context : (context?.startingYear ?? 2026);
export function gameDate(week, context = 2026) {
  const date = new Date(
    Date.UTC(yearOf(context), 0, 5) + Number(week) * 7 * 86400000,
  );
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
export const gameYear = (week, context = 2026) =>
  new Date(
    Date.UTC(yearOf(context), 0, 5) + week * 7 * 86400000,
  ).getUTCFullYear();
export function displayDates(html, context = 2026) {
  return html.replace(
    /\b(?:at |in |for |until |ends at |deadline |review at )?[Ww]eek (\d+)\b/g,
    (match, n) => match.replace(/[Ww]eek \d+/, gameDate(Number(n), context)),
  );
}
