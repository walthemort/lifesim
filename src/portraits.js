// Portraits are rendered locally from the saved appearance, with seven age stages.
export function portraitStage(age) {
  return age < 1
    ? "Baby"
    : age < 5
      ? "Infant"
      : age < 13
        ? "Child"
        : age < 18
          ? "Teen"
          : age < 30
            ? "Young adult"
            : age < 60
              ? "Adult"
              : "Older adult";
}
let serial = 0;
const colours = {
  Black: "#302d35",
  Brown: "#6b493c",
  Blonde: "#d4ad65",
  Red: "#ad5f42",
  Grey: "#b4b6c4",
  Green: "#71bca6",
  Blue: "#7faae0",
  Purple: "#b49bd3",
  Orange: "#e8a67e",
};
export function characterPortrait(p) {
  const years = p.visualAge ?? 24,
    stage = portraitStage(years),
    baby = years < 1,
    young = years < 5,
    child = years < 13,
    old = years >= 60,
    id = `portrait-${serial++}`;
  const skin =
    {
      Porcelain: "#f4d4bf",
      Light: "#edbd99",
      Olive: "#d2ad83",
      Medium: "#c58d67",
      Tan: "#b57b55",
      Deep: "#875d46",
      "Rich deep": "#624537",
    }[p.skin] || "#c58d67";
  const hair = old ? "#bbc0cc" : colours[p.hair] || colours.Brown,
    outfit = colours[p.outfit] || colours.Green,
    eyes = colours[p.eyes] || "#5e4438";
  const styles = {
    Short:
      "M43 67V49Q40 20 78 22Q118 16 118 52L113 68 106 49Q76 57 54 46L51 68Z",
    Long: "M42 68V48Q41 18 81 20Q121 21 117 64L109 70 106 47 94 36Q74 54 53 48L50 70Z",
    Curly:
      "M42 67Q28 54 37 43Q27 30 44 25Q45 11 63 19Q78 7 90 20Q108 12 117 30Q132 40 119 54L112 68 104 47Q79 53 55 47L49 68Z",
    Shaved: "",
    "Buzz cut": "M46 50Q44 25 79 25Q112 25 114 51L106 45Q78 34 53 46Z",
    Fade: "M44 67V47Q45 20 82 22Q116 23 116 53L111 69 104 48Q77 55 54 46L50 69Z",
    "Side part":
      "M43 64V47Q42 20 80 21Q118 19 117 55L111 66 104 39Q80 52 53 49L50 66Z",
    Ponytail:
      "M110 36Q135 29 137 56Q142 80 124 103L118 65M44 65V46Q46 20 81 22Q114 22 116 58L107 65 102 42Q77 31 54 48L50 67Z",
    Bob: "M40 66V47Q39 18 81 20Q120 19 120 59L112 69 105 44 94 34Q74 51 53 46L49 68Z",
    Braids:
      "M43 63V43Q45 18 81 21Q119 19 117 60L108 64 103 42Q78 36 55 46L51 65ZM42 50L34 132 44 132 52 54ZM109 49L118 132 128 130 118 49Z",
    Dreadlocks:
      "M39 63Q33 23 67 20Q106 12 121 42L120 65 108 60 102 37 93 55 81 36 68 55 57 39 49 67ZM40 53L35 125 47 125 53 58ZM112 56L117 124 129 123 122 51Z",
    Afro: "M41 70Q19 62 27 44Q17 27 40 23Q44 3 64 14Q82 0 97 14Q119 10 123 30Q145 37 130 55Q134 72 114 73L105 49Q79 36 54 49Z",
    "Space buns":
      "M42 38Q22 36 26 21Q33 6 51 24M109 26Q122 6 136 22Q142 38 120 43M43 65V44Q46 20 80 22Q114 20 116 58L107 65 102 43Q77 33 54 47L50 67Z",
    "Wolf cut":
      "M39 66L41 45Q42 18 81 21Q120 20 119 49L124 113 109 103 102 45 94 61 81 43 67 60 55 44 49 108 36 116Z",
    Pompadour:
      "M43 65V47Q25 25 52 15Q78 2 105 19Q121 29 117 53L111 66 103 43Q80 52 54 46L50 67Z",
  };
  const front = baby
    ? "M65 39Q72 21 83 34Q91 28 97 40Q82 33 65 39Z"
    : (styles[p.hairstyle] ?? styles.Short);
  const long =
    !baby &&
    ["Long", "Bob", "Ponytail", "Braids", "Dreadlocks", "Wolf cut"].includes(
      p.hairstyle,
    );
  const faceRx = young
    ? 36
    : p.face === "Round"
      ? 36
      : p.face === "Angular"
        ? 31
        : 33;
  const garment = p.garment || "T-shirt",
    formal = ["Suit", "Formal"].includes(garment);
  const back = long
    ? `<path d="M42 51Q36 19 81 21Q126 20 120 57L128 139Q81 154 33 139Z" fill="${hair}"/>`
    : "";
  const proportions = baby
    ? [0.7, 0.7]
    : young
      ? [0.72, 0.68]
      : child
        ? [0.82, 0.8]
        : years < 18
          ? [0.9, 0.94]
          : years < 30
            ? [1, 1]
            : old
              ? [0.96, 0.96]
              : [1.05, 1];
  const headTransform = baby
    ? "translate(0 7)"
    : young
      ? "translate(6 16) scale(.925 .94)"
      : child
        ? "translate(6 12) scale(.925 .96)"
        : years < 18
          ? "translate(3 4) scale(.96 1)"
          : "";
  const body = baby
    ? `<path d="M32 180v-30q4-30 48-31 44 1 48 31v30Z" fill="url(#${id}-fabric)"/><path d="M40 140q37 32 80 17M34 159q25-4 45-30" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>`
    : `<path d="M15 180v-22q2-31 48-36h34q46 5 48 36v22Z" fill="url(#${id}-fabric)"/><path d="M66 112v17q14 15 28 0v-17" fill="${skin}"/>${formal ? '<path d="M62 123l18 22 18-22-6 57H68Z" fill="#f2eee9"/><path d="M76 140h8l4 23-8 12-8-12Z" fill="#5b6b94"/>' : garment === "Hoodie" ? '<path d="M57 126q23 23 47 0M64 140v22m32-22v22" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="3"/>' : garment === "Shirt" ? '<path d="M62 124l18 15 18-15m-18 15v41" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>' : '<path d="M61 126q19 19 38 0" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>'}`;
  const beard =
    !child && years >= 18 && p.facialHair === "Beard"
      ? `<path d="M51 86q9 31 29 31 23-1 30-31l-4 20q-25 29-51 0Z" fill="${hair}" opacity=".9"/>`
      : !child && years >= 18 && p.facialHair === "Stubble"
        ? `<path d="M57 100q23 25 46-1" fill="none" stroke="${hair}" stroke-width="3" stroke-dasharray="1 4" opacity=".45"/>`
        : "";
  const label = `${stage} character portrait`;
  return `<svg class="character-portrait friendly-portrait" data-age-stage="${stage.toLowerCase().replaceAll(" ", "-")}" viewBox="0 0 160 180" role="img" aria-label="${label}"><defs><linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${skin}"/><stop offset="1" stop-color="${skin}" stop-opacity=".94"/></linearGradient><linearGradient id="${id}-fabric" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${outfit}"/><stop offset="1" stop-color="${outfit}" stop-opacity=".72"/></linearGradient></defs><rect width="160" height="180" rx="30" fill="#e9ece51a"/><circle cx="81" cy="73" r="61" fill="#cdddc51c"/>${baby ? body : `<g transform="translate(80 180) scale(${proportions.join(" ")}) translate(-80 -180)">${body}</g>`}<g transform="${headTransform}">${back}<g><ellipse cx="46" cy="78" rx="7" ry="10" fill="${skin}"/><ellipse cx="114" cy="78" rx="7" ry="10" fill="${skin}"/><rect x="${80 - faceRx}" y="30" width="${faceRx * 2}" height="85" rx="${young ? 35 : 30}" fill="url(#${id}-skin)"/><ellipse cx="58" cy="89" rx="7" ry="4" fill="#e88a801f"/><ellipse cx="102" cy="89" rx="7" ry="4" fill="#e88a801f"/>${beard}<path d="M60 66q6-3 12 0m16 0q6-3 12 0" fill="none" stroke="${hair}" stroke-width="${p.eyebrows === "Thick" ? 3 : 2}" stroke-linecap="round" opacity=".8"/><g fill="${eyes}"><ellipse cx="66" cy="77" rx="3.5" ry="${young ? 4 : 4.3}"/><ellipse cx="94" cy="77" rx="3.5" ry="${young ? 4 : 4.3}"/></g><g fill="#fff" opacity=".8"><circle cx="67" cy="76" r="1"/><circle cx="95" cy="76" r="1"/></g><path d="M79 82q-3 7 3 7" fill="none" stroke="#4f312b" stroke-opacity=".24" stroke-width="2" stroke-linecap="round"/><path d="M70 98q10 9 20 0" fill="none" stroke="#55382f" stroke-opacity=".65" stroke-width="2.5" stroke-linecap="round"/>${!child && p.facialHair === "Moustache" ? `<path d="M68 93q6-6 12-1 6-5 12 1" fill="none" stroke="${hair}" stroke-width="3"/>` : ""}${old ? '<path d="M55 77l-4 2m54-2 4 2M68 58q12-3 24 0" fill="none" stroke="#4f312b" stroke-opacity=".19" stroke-width="1.5"/>' : ""}<path d="${front}" fill="${hair}"/>${!young && ["Braids", "Dreadlocks"].includes(p.hairstyle) ? '<path d="M44 65l-5 62m77-62 7 61" stroke="#fff" stroke-opacity=".16" stroke-width="2" stroke-dasharray="4 3"/>' : ""}</g>${old ? '<g fill="none" stroke="#506071" stroke-width="1.8"><rect x="54" y="69" width="24" height="17" rx="7"/><rect x="84" y="69" width="24" height="17" rx="7"/><path d="M78 75h6"/></g>' : ""}</g></svg>`;
}
