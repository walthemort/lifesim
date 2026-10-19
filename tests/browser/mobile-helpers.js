const categories = new Set([
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
// Follow the visible tab UI when a control belongs to a different workspace pane.
export async function reveal(page, locator) {
  if (!(await locator.count())) {
    const shortcut = page
      .locator(
        'main button[data-view="sports"], main button[data-view="music"]',
      )
      .filter({ hasText: /Open (sporting career|music workspace)/ })
      .first();
    if (await shortcut.isVisible()) await shortcut.click();
    if (!(await locator.count())) return;
  }
  const ids = await locator.first().evaluate((el) => {
    const ids = [];
    for (let n = el; n; n = n.parentElement)
      if (n.getAttribute("role") === "tabpanel") ids.unshift(n.id);
    return ids;
  });
  for (const id of ids) {
    const panel = page.locator(`[id="${id}"]`);
    if (!(await panel.isVisible()))
      await page.locator(`[role="tab"][aria-controls="${id}"]`).click();
  }
  const details = await locator
    .first()
    .locator("xpath=ancestor::details[not(@open)]")
    .all();
  for (const item of details.reverse())
    await item.locator(":scope > summary").click();
}
export async function interact(page, locator, method, ...args) {
  await reveal(page, locator);
  return locator[method](...args);
}
export async function tap(page, name) {
  if (
    (await page.getByRole("dialog").isVisible()) &&
    (categories.has(name) ||
      ["Overview", "Messages & decisions", "Career tab", "Sport tab"].includes(
        name,
      ))
  )
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  if (name === "Overview") name = "Home tab";
  if (name === "Messages & decisions") name = "Inbox tab";
  if (name === "Sport tab") return tap(page, "Sport & development");
  if (name === "Career tab") return tap(page, "Work & education");
  if (categories.has(name)) {
    await page.getByRole("button", { name: "World tab", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  } else {
    const locator = page.getByRole("button", {
      name,
      exact: true,
      includeHidden: true,
    });
    await interact(page, locator, "click");
  }
}
