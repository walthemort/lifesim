const categories = new Set([
  "Overview",
  "Messages & decisions",
  "Living world & finances",
  "Childhood & school",
  "Character & hometown",
  "Health & ageing",
  "Weekly calendar",
  "Work & education",
  "Start & run a company",
  "Crime & consequences",
  "Sport & development",
  "Music & creativity",
  "Social media & fame",
  "Relationships",
  "Family & pets",
  "Homes & property",
  "Hobbies & journal",
  "Investments",
  "Banking & tax",
  "Lifestyle & shopping",
  "Businesses & clubs",
]);
export async function tap(page, name) {
  if (categories.has(name)) {
    if (await page.getByRole("dialog").isVisible())
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
    await page.getByRole("button", { name: "World tab", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  } else await page.getByRole("button", { name, exact: true }).click();
}
