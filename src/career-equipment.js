import { SHOP, buy, age, availableCash } from "./engine.js";

import { STUDIO_ITEMS } from "./catalogue.js";
export function equipmentRequirements(s, id) {
  const missing = [];
  if (
    id === "treated-studio" &&
    !["laptop", "workstation"].some((i) => s.inventory.includes(i))
  )
    missing.push("a computer");
  if (id === "professional-studio") {
    for (const i of [
      "workstation",
      "audio-interface",
      "studio-monitors",
      "treated-studio",
    ])
      if (!s.inventory.includes(i))
        missing.push(SHOP.find((x) => x.id === i).name);
    if (s.music.skills.production < 40) missing.push("40 production skill");
    if (s.music.releases.length < 2) missing.push("two released tracks");
  }
  return missing;
}
export function musicStudioBonus(s) {
  return (
    (s.inventory.includes("audio-interface") ? 2 : 0) +
    (s.inventory.includes("studio-monitors") ? 3 : 0) +
    (s.inventory.includes("professional-studio")
      ? 12
      : s.inventory.includes("treated-studio")
        ? 5
        : 0)
  );
}
export function careerEquipmentGroups(s) {
  const groups = [];
  if (s.music.active)
    groups.push({
      id: "music",
      name: "Music equipment & studio upgrades",
      description:
        "Upgrade your recording setup here. Better equipment improves release quality; practice, distribution and an audience still matter.",
      items: [
        "laptop",
        "workstation",
        "microphone",
        "editing",
        ...STUDIO_ITEMS.map((i) => i.id),
      ],
    });
  if (s.football.stage !== "none" && s.football.stage !== "retired")
    groups.push({
      id: "football",
      name: "Football equipment",
      description:
        "Equipment supports regular training. It does not replace academy selection or a club contract.",
      items: ["boots", "training-kit", "gym"],
    });
  if (Object.values(s.social.profiles).some((p) => p.active))
    groups.push({
      id: "creator",
      name: "Creator equipment",
      description:
        "Build your filming, editing and streaming setup. Equipment improves content quality; followers are earned through your posts.",
      items: [
        "phone",
        "premium-phone",
        "camera",
        "microphone",
        "lighting",
        "tripod",
        "webcam",
        "laptop",
        "workstation",
        "editing",
      ],
    });
  if (s.sports.racing.stage !== "none" && s.sports.racing.stage !== "retired")
    groups.push({
      id: "racing",
      name: "Racing equipment",
      description:
        "A simulator supports driving practice between events. Sporting progression still requires experience and invitations.",
      items: ["sim-rig", "gym"],
    });
  return groups;
}
export function buyCareerEquipment(s, group, id) {
  if (
    !careerEquipmentGroups(s).some(
      (g) => g.id === group && g.items.includes(id),
    )
  )
    throw new Error("This equipment is not part of an active career or hobby.");
  return buy(s, id);
}
export function careerEquipmentScreen(s, u, only = null) {
  const { panelHeading, money, e } = u;
  return careerEquipmentGroups(s)
    .filter((g) => !only || g.id === only)
    .map(
      (g) =>
        `<section class="panel" data-equipment-group="${g.id}">${panelHeading(g.name, g.description)}${g.id === "music" ? `<p class="muted">Current room: ${s.inventory.includes("professional-studio") ? "Professional studio" : s.inventory.includes("treated-studio") ? "Treated home studio" : "Bedroom setup"}. Studio equipment contributes +${musicStudioBonus(s)} recording quality. Your possessions also appear in Lifestyle & shopping.</p>` : ""}<div class="education-grid">${g.items
          .map((id) => {
            const item = SHOP.find((i) => i.id === id);
            if (!item) return "";
            const owned = s.inventory.includes(id),
              requirements = equipmentRequirements(s, id);
            if (age(s) < (item.minAge || 12))
              requirements.push(`age ${item.minAge || 12}+`);
            const affordable = availableCash(s) >= item.price;
            return `<article class="education-card" data-equipment="${id}"><h3>${e(item.name)}</h3><p>${e(item.description || item.desc || "Equipment for your craft.")}</p><p>${money(item.price)}${item.upkeep ? ` · ${money(item.upkeep)}/week upkeep` : ""}</p><small>${owned ? "Owned" : requirements.length ? `Requires: ${e(requirements.join(", "))}` : !affordable ? "Save up to afford this upgrade." : "Available to purchase"}</small><button class="button secondary full-width" data-action="career-buy" data-group="${g.id}" data-id="${id}" ${owned || requirements.length || !affordable || s.ended ? "disabled" : ""}>${owned ? "Owned" : "Buy equipment"}</button></article>`;
          })
          .join("")}</div></section>`,
    )
    .join("");
}
