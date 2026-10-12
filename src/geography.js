import countries from "./countries.json" with { type: "json" };
import places from "./places.json" with { type: "json" };
export const COUNTRIES = countries;
export const CITY_CATALOGUE = places;
export const country = (code) => countries.find((c) => c.code === code);
export const validPlace = (code, city) =>
  !!country(code) && places[code]?.includes(city);
const cityCountries = new Map();
for (const [code, cities] of Object.entries(places))
  for (const name of cities)
    if (!cityCountries.has(name)) cityCountries.set(name, code);
for (const [name, code] of Object.entries({
  London: "GB",
  Copenhagen: "DK",
  "New York": "US",
  Monaco: "MC",
}))
  cityCountries.set(name, code);
export const placeCountry = (city) => cityCountries.get(city) || null;
export const knownCity = (city) => cityCountries.has(city);
export const WORLD_CITIES = [
  "London",
  "Copenhagen",
  "New York",
  "Monaco",
  ...new Set(countries.map((c) => c.capital).filter(knownCity)),
];
export const IMMIGRATION = {
  US: { years: 5, fee: 900, wait: 26, strict: true },
  CA: { years: 3, fee: 600, wait: 20, strict: true },
  AU: { years: 4, fee: 750, wait: 20, strict: true },
  GB: { years: 5, fee: 1500, wait: 26, strict: false },
  DK: { years: 9, fee: 650, wait: 26, strict: false },
  DE: { years: 5, fee: 350, wait: 20, strict: false },
  FR: { years: 5, fee: 300, wait: 20, strict: false },
  JP: { years: 5, fee: 400, wait: 26, strict: true },
  SG: { years: 5, fee: 800, wait: 26, strict: true },
  AE: { years: null, fee: 2000, wait: 39, strict: true },
  MC: { years: 10, fee: 1800, wait: 39, strict: false },
};
export const immigrationRule = (code) =>
  IMMIGRATION[code] || { years: 5, fee: 500, wait: 20, strict: false };
export const townTemplate = (city) => ({
  scale: city === "Monaco" ? 1.6 : city === "New York" ? 1.15 : 1,
  school: `${city} Community School`,
  club: `${city} Community Sports`,
  venue: `${city} Arts Centre`,
  employer: `${city} Local Traders`,
  neighbourhood: "Town centre",
});
