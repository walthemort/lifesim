import {
  SHOP,
  EXPERIENCES,
  age,
  availableCash,
  propertyListings,
  mortgagePayment,
  RENTALS,
} from "./engine.js";
import { localPrice, resalePrice, rentTerms } from "./economy.js";
import { CLOTHING, PRO_HAIRSTYLES } from "./expansion-data.js";
import { characterPortrait } from "./identity-screens.js";
import { creatorAvailable } from "./identity.js";
import { equipmentRequirements } from "./career-equipment.js";
import { gameDate } from "./dates.js";
import {
  RETAIL_CATEGORIES,
  RETAIL_BUSINESSES,
  storeProducts,
} from "./retail-data.js";
import { retailIllustration } from "./retail-art.js";
const disabled = (s) =>
  !s.actions || s.event || s.ended || s.globalLife.crime.prison
    ? "disabled"
    : "";
function serviceScreen(s, u, store) {
  const { e, money, panelHeading } = u,
    selected = store.id;
  let body = "";
  if (CLOTHING.some((i) => i.store === selected)) {
    body = `<section class="panel wide-panel">${panelHeading("Try on the collection", "Try on clothes before buying. Previewing costs nothing.")}<div class="boutique-layout"><div class="dressing-room" data-dressing-room>${characterPortrait({ ...s.characterLife.profile, visualAge: age(s), condition: s.health })}<h3>${e(s.name)}</h3><p data-outfit-name>Your current look</p><button class="button secondary" data-action="retail-reset">Reset preview</button></div><div class="everyday-grid">${CLOTHING.filter(
      (i) => i.store === selected,
    )
      .map(
        (i) =>
          `<article class="everyday-card"><div class="fabric-swatch" style="--fabric:${{ Blue: "#5378a5", Green: "#52977e", Orange: "#b77b58", Purple: "#8073a9", Black: "#262834" }[i.outfit]}"></div><h3>${e(i.name)}</h3><p>${money(localPrice(s, i.price))} · ${e(i.garment)} · no recurring fees</p><div class="inline-actions"><button class="button secondary" data-action="outfit-preview" data-id="${i.id}">Try on</button><button class="button primary" data-action="${s.globalLife.wardrobe.includes(i.id) ? "outfit-wear" : "outfit-buy"}" data-id="${i.id}" ${disabled(s)}>${s.globalLife.wardrobe.includes(i.id) ? "Wear outfit" : "Buy outfit"}</button></div></article>`,
      )
      .join("")}</div></div></section>`;
  } else if (store.kind === "barber") {
    const options = [
      "Short",
      "Long",
      "Curly",
      "Shaved",
      "Buzz cut",
      "Fade",
      "Side part",
      "Ponytail",
      "Bob",
      ...(creatorAvailable(s) ? PRO_HAIRSTYLES : []),
    ];
    body = `<section class="panel wide-panel">${panelHeading("Barbers & salons", "Appointments take one action and two hours. Preview your cut first.")}<form id="barber-form"><div class="identity-preview">${characterPortrait({ ...s.characterLife.profile, visualAge: age(s), condition: s.health })}<div><h3>Find your next look.</h3><p>Premium styles unlock with Pro or Debug. All haircuts are cosmetic.</p></div></div><div class="everyday-grid"><input name="tier" type="hidden" value="${store.tier}"><p class="barber-price">Appointment · ${money({ local: 20, salon: 75, atelier: 250 }[store.tier])}</p><label class="field-label">Hair style<select name="hairstyle">${options.map((v) => `<option ${v === s.characterLife.profile.hairstyle ? "selected" : ""}>${e(v)}</option>`).join("")}</select></label><label class="field-label">Hair colour<select name="hair">${["Black", "Brown", "Blonde", "Red", "Grey"].map((v) => `<option ${v === s.characterLife.profile.hair ? "selected" : ""}>${v}</option>`).join("")}</select></label></div><button class="button primary" ${disabled(s)}>Book haircut</button></form></section>`;
  }
  return body;
}

function stockFor(store) {
  if (store.kind === "products") return storeProducts(SHOP, store.id);
  if (store.kind === "clothing")
    return CLOTHING.filter((i) => i.store === store.id);
  return [];
}
function storeTile(s, store, u) {
  const stock = stockFor(store),
    count = stock.length;
  const detail = count
    ? `${count} ${store.kind === "clothing" ? "outfits" : "models & products"} · from ${u.money(Math.min(...stock.map((i) => localPrice(s, i.price))))}`
    : store.kind === "property"
      ? `${store.types.length} property types`
      : store.kind === "experiences"
        ? `${store.experiences.length} experiences`
        : store.kind === "rentals"
          ? "Rooms, studios & family homes"
          : "Haircuts & colour";
  return `<button class="retail-business-tile" data-action="retail-store" data-id="${u.e(store.id)}" style="--retail-accent:${store.accent}"><span class="retail-business-mark">${u.e(
    store.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join(""),
  )}</span>${retailIllustration(store.silhouette || (store.kind === "clothing" ? "clothing" : ["property", "rentals"].includes(store.kind) ? "home" : "bag"), store.accent)}<span class="eyebrow">${u.e(store.specialty || store.kind)}</span><strong>${u.e(store.name)}</strong><span>${u.e(store.description)}</span><small>${detail}</small><span class="visit-business">Visit ${u.e(store.name)} ${u.icon("arrow")}</span></button>`;
}
function productCards(s, u, stock, filters = {}, onlyOwned = false) {
  const { e, money } = u,
    categories = ["All", ...new Set(stock.map((i) => i.category))],
    category = categories.includes(filters.category) ? filters.category : "All",
    query = filters.query || "",
    sort = filters.sort || "catalogue",
    owned = onlyOwned || filters.owned;
  const items = stock.filter(
    (i) =>
      (category === "All" || i.category === category) &&
      (!owned || s.inventory.includes(i.id)) &&
      `${i.name} ${i.category} ${i.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "low") items.sort((a, b) => a.price - b.price);
  if (sort === "high") items.sort((a, b) => b.price - a.price);
  return `<section class="panel shop-controls"><div class="form-row"><label class="field-label">Shopping category<select id="shop-category">${categories.map((c) => `<option ${c === category ? "selected" : ""}>${e(c)}</option>`).join("")}</select></label><label class="field-label">Search shopping<input id="shop-query" type="search" value="${e(query)}" placeholder="Search this ${onlyOwned ? "collection" : "business"}"></label><label class="field-label">Sort shopping<select id="shop-sort"><option value="catalogue">Catalogue order</option><option value="low" ${sort === "low" ? "selected" : ""}>Price: low to high</option><option value="high" ${sort === "high" ? "selected" : ""}>Price: high to low</option></select></label></div><label class="check-label"><input id="shop-owned" type="checkbox" ${owned ? "checked" : ""} ${onlyOwned ? "disabled" : ""}> Show owned possessions only</label><p class="muted" role="status">${items.length} results · ${money(availableCash(s))} uncommitted cash</p></section><div class="shop-grid retail-stock">${
    items
      .map((i) => {
        const held = s.inventory.includes(i.id),
          price = localPrice(s, i.price),
          minAge =
            i.minAge ||
            (["Garage", "Property", "Travel"].includes(i.category) ? 18 : 12),
          young = age(s) < minAge,
          requirements = equipmentRequirements(s, i.id),
          blocked =
            s.ended ||
            s.event ||
            s.globalLife.crime.prison ||
            (!held &&
              (young || requirements.length || availableCash(s) < price));
        return `<article class="panel shop-card" data-product="${i.id}"><div class="retail-product-scene">${retailIllustration(i.silhouette || { Garage: "car", Travel: i.id === "yacht" ? "yacht" : "plane", Property: "home", Style: i.icon === "watch" ? "watch" : "bag", Workspace: "computer", "Creator gear": "camera", Wellbeing: "fitness", Hobbies: "box" }[i.category])}${held ? u.tag("Owned", "green") : ""}</div><div class="product-copy"><span class="eyebrow">${e(i.category)}</span><h2>${e(i.name)}</h2><p>${e(i.description)}</p>${i.details?.length ? `<div class="retail-specs">${i.details.map((d) => `<span>${e(d)}</span>`).join("")}</div>` : ""}${!held && requirements.length ? `<p class="muted">Requires: ${e(requirements.join(", "))}</p>` : ""}<div class="product-price"><strong>${money(price)}</strong><span>${i.upkeep ? `${money(i.upkeep)}/wk upkeep` : "No weekly upkeep"}</span></div><button class="button ${held ? "secondary" : "primary"} full-width" data-action="${held ? "sell-item" : "buy"}" data-id="${i.id}" ${blocked ? "disabled" : ""}>${held ? `Sell for ${money(resalePrice(s, i))}` : young ? `Available at age ${minAge}` : requirements.length ? "Requirements not met" : availableCash(s) < price ? "Keep building your savings" : "Make it yours"}</button></div></article>`;
      })
      .join("") ||
    '<section class="panel retail-empty"><h2>Nothing here yet.</h2><p>Try another search or turn off the owned filter.</p></section>'
  }</div>`;
}
function propertyStore(s, u, store) {
  const { e, money } = u;
  const listings = propertyListings(s).filter((p) =>
    store.types.includes(p.id),
  );
  return `<section class="panel"><p>Live property listings · refreshed quarterly. Cash purchases pay 2% closing fees. A mortgage needs a 20% deposit, qualifying employment, affordable payments and cash reserves.</p><button class="text-button" data-view="housing">Manage your homes & tenants ${u.icon("arrow")}</button></section><div class="shop-grid">${listings.map((p) => `<article class="panel shop-card" data-property-listing="${p.id}"><div class="retail-product-scene">${retailIllustration("home", store.accent)}</div><div class="product-copy"><span class="eyebrow">${p.bedrooms} BEDROOMS</span><h2>${e(p.name)}</h2><p>Listing closes ${gameDate(p.expiresWeek, s)}. Purchase and move-in are separate decisions.</p><div class="product-price"><strong>${money(p.asking)}</strong><span>${money(p.upkeep)}/week upkeep</span></div><p class="muted">Potential rent ${money(p.rent)}/week · mortgage estimate ${money(mortgagePayment(p.asking * 0.8), 2)}/week</p><button class="button primary full-width" data-action="purchase-home" data-id="${p.id}" ${age(s) < 18 || disabled(s) ? "disabled" : ""}>Review purchase</button></div></article>`).join("")}</div>`;
}
function rentalsStore(s, u) {
  return `<div class="shop-grid">${RENTALS.map((r) => ({
    ...r,
    ...rentTerms(s, r),
  }))
    .map(
      (r) =>
        `<article class="panel shop-card"><div class="retail-product-scene">${retailIllustration("home", "#b8c3a0")}</div><div class="product-copy"><h2>${u.e(r.name)}</h2><p>${r.bedrooms} bedrooms · ${u.money(r.deposit)} refundable deposit, plus $100 moving cost.</p><div class="product-price"><strong>${u.money(r.rent)}/week</strong></div><button class="button primary full-width" data-action="rent-home" data-id="${r.id}" ${age(s) < 18 || disabled(s) ? "disabled" : ""}>Review rental</button></div></article>`,
    )
    .join(
      "",
    )}</div><section class="panel"><button class="text-button" data-view="housing">Manage your home</button></section>`;
}
function experiencesStore(s, u, store) {
  return `<section class="panel experiences-panel"><h2>Make a memory.</h2><p>Each booking uses an action and three calendar hours. Career commitments continue.</p><div class="education-grid">${EXPERIENCES.filter(
    (x) => store.experiences.includes(x.id),
  )
    .map((x) => {
      const remaining = Math.max(
          0,
          (s.experienceCooldowns[x.id] || 0) - s.week,
        ),
        blocked =
          disabled(s) ||
          age(s) < (x.minAge || 12) ||
          remaining ||
          availableCash(s) < x.price ||
          (x.football &&
            !["school", "academy", "community"].includes(s.football.stage));
      return `<article class="education-card"><h3>${u.e(x.name)}</h3><p>${u.e(x.description)}</p><strong>${u.money(x.price)}</strong><small>${remaining ? `Available again in ${remaining} weeks` : `Available every ${x.cooldown} week(s)`}</small><button class="button secondary full-width" data-action="experience" data-id="${x.id}" ${blocked ? "disabled" : ""}>Plan experience</button></article>`;
    })
    .join("")}</div></section>`;
}
export function retailScreen(
  s,
  u,
  { category = null, storeId = null, filters = {}, belongings = false } = {},
) {
  const store = RETAIL_BUSINESSES.find((b) => b.id === storeId),
    district = RETAIL_CATEGORIES.find(
      ([id]) => id === (store?.category || category),
    );
  const crumbs = `<nav class="retail-breadcrumbs" aria-label="Shopping location"><button data-action="retail-home">Shopping</button>${district ? `<span>/</span><button data-action="retail-category" data-id="${district[0]}">${u.e(district[1])}</button>` : ""}${store ? `<span>/</span><span aria-current="page">${u.e(store.name)}</span>` : belongings ? '<span>/</span><span aria-current="page">My belongings</span>' : ""}</nav>`;
  const summary = `<div class="retail-wallet"><span>Available cash <strong>${u.money(availableCash(s))}</strong></span><button class="button secondary" data-action="retail-belongings">My belongings</button></div>`;
  if (belongings) {
    const wardrobe = s.globalLife.wardrobe.map((id) =>
      CLOTHING.find((i) => i.id === id),
    );
    return (
      crumbs +
      u.title(
        "YOUR COLLECTION",
        "My belongings.",
        `${s.inventory.length} possessions · ${u.money(SHOP.filter((i) => s.inventory.includes(i.id)).reduce((n, i) => n + i.upkeep, 0))}/week possession upkeep.`,
      ) +
      productCards(
        s,
        u,
        SHOP.filter(
          (i) => s.inventory.includes(i.id) && i.category !== "Ownership",
        ),
        filters,
        true,
      ) +
      `<section class="panel"><h2>Your wardrobe</h2><div class="inline-actions">${wardrobe.map((i) => `<button class="button secondary" data-action="outfit-wear" data-id="${i.id}">${u.e(i.name)}${s.globalLife.wearing === i.id ? " · wearing" : ""}</button>`).join("") || '<p class="muted">Visit a clothing store to find your first outfit.</p>'}</div><button class="text-button" data-view="housing">Homes & property portfolio</button></section>`
    );
  }
  if (store) {
    const hero = `<section class="retail-storefront" style="--retail-accent:${store.accent}" data-retail-business="${u.e(store.id)}"><span class="eyebrow">${u.e(store.specialty || district[1])}</span><h1>${u.e(store.name)}</h1><p>${u.e(store.description)}</p><button class="text-button" data-action="retail-category" data-id="${district[0]}">Explore other ${store.category === "vehicles" ? "dealers" : "businesses"} ${u.icon("arrow")}</button></section>`;
    const body =
      store.kind === "products"
        ? productCards(s, u, storeProducts(SHOP, store.id), filters)
        : ["clothing", "barber"].includes(store.kind)
          ? serviceScreen(s, u, store)
          : store.kind === "property"
            ? propertyStore(s, u, store)
            : store.kind === "rentals"
              ? rentalsStore(s, u)
              : experiencesStore(s, u, store);
    return crumbs + summary + hero + body;
  }
  if (district)
    return (
      crumbs +
      summary +
      u.title("SHOPPING DISTRICT", `${district[1]}.`, district[2]) +
      `<nav class="retail-businesses" aria-label="${u.e(district[1])} businesses">${RETAIL_BUSINESSES.filter(
        (b) => b.category === district[0],
      )
        .map((b) => storeTile(s, b, u))
        .join("")}</nav>`
    );
  return (
    u.title(
      "YOUR CITY, YOUR TASTE",
      "Where are we going?",
      "Choose a category, find a business, and step inside.",
    ) +
    summary +
    `<nav class="retail-categories" aria-label="Shopping categories">${RETAIL_CATEGORIES.map(([id, name, description, glyph, accent]) => `<button class="retail-category-card" data-action="retail-category" data-id="${id}" style="--retail-accent:${accent}"><span>${u.icon(glyph)}</span><strong>${u.e(name)}</strong><small>${u.e(description)}</small><span class="category-business-count">${RETAIL_BUSINESSES.filter((b) => b.category === id).length} businesses ${u.icon("arrow")}</span></button>`).join("")}</nav><section class="panel retail-career-link"><h2>Build your professional setup.</h2><p>Studio upgrades and specialist career equipment live alongside your work.</p><div class="inline-actions"><button class="text-button" data-view="music">Music studio</button><button class="text-button" data-view="sports">Sporting kit</button><button class="text-button" data-view="investments">Collectible auctions</button></div></section>`
  );
}
