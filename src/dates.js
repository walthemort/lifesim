export function gameDate(week) {
  const date = new Date(Date.UTC(2026, 0, 5) + Number(week) * 7 * 86400000);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
export const gameYear = (week) =>
  new Date(Date.UTC(2026, 0, 5) + week * 7 * 86400000).getUTCFullYear();
// Legacy save text stores absolute simulation weeks. Keep durations, convert timestamps.
export function displayDates(html) {
  return html.replace(
    /\b(?:at |in |for |until |ends at |deadline |review at )?[Ww]eek (\d+)\b/g,
    (match, n) => match.replace(/[Ww]eek \d+/, gameDate(Number(n))),
  );
}
