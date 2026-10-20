// Decorative, local showroom artwork. Product names remain readable text.
export function retailIllustration(kind = "box", accent = "#9ab9c8") {
  const wheels =
    '<circle cx="69" cy="121" r="18" fill="#18202b"/><circle cx="69" cy="121" r="9" fill="#a7b5bd"/><circle cx="228" cy="121" r="18" fill="#18202b"/><circle cx="228" cy="121" r="9" fill="#a7b5bd"/>';
  const shapes = {
    car: `<path d="M31 112l9-29 47-8 31-31h67l36 34 49 13 9 28H31Z" fill="${accent}"/><path d="M104 75l24-23h48l27 25Z" fill="#293b4d"/>${wheels}`,
    classic: `<path d="M30 112V87l62-10 33-31h59l28 31 54 10 12 29H30Z" fill="${accent}"/><path d="M110 76l23-24h42l20 25Z" fill="#34495a"/><path d="M42 98h225" stroke="#d7ddd7" stroke-width="3"/>${wheels}`,
    sport: `<path d="M28 114l13-21 58-12 42-28h48l39 29 40 11 17 25H28Z" fill="${accent}"/><path d="M118 80l29-21h34l29 22Z" fill="#293848"/><path d="M253 83h25" stroke="${accent}" stroke-width="7"/>${wheels}`,
    suv: `<path d="M31 116V72l25-8 17-26h130l27 33 41 17 7 30H31Z" fill="${accent}"/><path d="M82 48h112l19 26H68Z" fill="#2b4050"/><path d="M141 46v30" stroke="${accent}" stroke-width="7"/>${wheels}`,
    motorbike: `<circle cx="77" cy="117" r="28" fill="#18202b" stroke="#9aa9b1" stroke-width="5"/><circle cx="230" cy="117" r="28" fill="#18202b" stroke="#9aa9b1" stroke-width="5"/><path d="M77 117l54-46 39 45H77l41-56m51 56 42-63 19 64m-34-70 20 8" fill="none" stroke="${accent}" stroke-width="10"/><path d="M113 57h48l23 27-55 2Z" fill="${accent}"/>`,
    yacht: `<path d="M28 106h254l-39 32H77Z" fill="${accent}"/><path d="M82 103l31-39h92l29 39Z" fill="#d6e1e4"/><path d="M128 75h67l17 23h-97Z" fill="#3a5468"/><path d="M146 62V38h45l18 26" fill="none" stroke="#bdcfd3" stroke-width="8"/><path d="M29 149q40-9 80 0t80 0 90 0" fill="none" stroke="${accent}" stroke-width="3"/>`,
    plane: `<path d="M24 91l103-12 29-47h18l-8 47 95 6 29 12-30 10-94-2 12 37h-20l-32-38-72-1-15-20Z" fill="${accent}"/><path d="M129 85l-6 32h53l-10-29" fill="#c7d8de"/><path d="M254 90l10 7-10 4" fill="#344e60"/>`,
    phone: `<rect x="112" y="24" width="80" height="123" rx="12" fill="${accent}"/><rect x="119" y="31" width="66" height="102" rx="8" fill="#263b50"/><path d="M128 105l42-51" stroke="${accent}" stroke-width="16" opacity=".5"/><circle cx="152" cy="140" r="3" fill="#263b50"/>`,
    computer: `<rect x="70" y="31" width="160" height="98" rx="8" fill="${accent}"/><rect x="79" y="40" width="142" height="80" rx="3" fill="#263b50"/><path d="M59 135h182l16 10H43Z" fill="#a6b9c3"/><path d="M92 101l36-38 34 24 38-33" fill="none" stroke="${accent}" stroke-width="5"/>`,
    camera: `<path d="M79 58h43l12-18h42l14 18h39v78H79Z" fill="${accent}"/><circle cx="155" cy="97" r="35" fill="#263b50"/><circle cx="155" cy="97" r="22" fill="#789cad"/><circle cx="149" cy="91" r="8" fill="#bcd8e0"/><rect x="196" y="69" width="20" height="10" rx="2" fill="#263b50"/>`,
    sofa: `<rect x="61" y="54" width="180" height="65" rx="20" fill="${accent}"/><path d="M58 87q-18 0-18 20v26h222v-26q0-20-18-20t-20 31H78q0-31-20-31" fill="${accent}"/><path d="M149 66v48M61 136v12m180-12v12" stroke="#243744" stroke-width="7"/>`,
    home: `<path d="M59 81l91-56 91 56v65H59Z" fill="${accent}"/><path d="M44 83l106-65 106 65" fill="none" stroke="#b6cbd1" stroke-width="9"/><rect x="128" y="94" width="42" height="52" fill="#2a4050"/><path d="M80 92h27v23H80zm112 0h27v23h-27Z" fill="#e1e7d9"/>`,
    watch: `<path d="M132 20h39l9 43v51l-9 42h-39l-8-42V63Z" fill="${accent}"/><circle cx="152" cy="88" r="40" fill="#233547" stroke="${accent}" stroke-width="10"/><path d="M152 62v28l19 11" fill="none" stroke="#e2e9e3" stroke-width="4"/>`,
    jewellery: `<ellipse cx="150" cy="96" rx="48" ry="45" fill="none" stroke="${accent}" stroke-width="12"/><path d="M127 43l10-19h26l10 19-23 25Z" fill="#dce6ea" stroke="${accent}" stroke-width="5"/>`,
    guitar: `<path d="M133 78q-31-8-40 20t17 43q45 28 64-6 14-23-8-41l11-55-17-4-15 52Z" fill="${accent}"/><circle cx="139" cy="110" r="13" fill="#293e4b"/><path d="M139 112l32-90" stroke="#cbd9db" stroke-width="5"/>`,
    speaker: `<rect x="98" y="27" width="105" height="124" rx="7" fill="${accent}"/><circle cx="150" cy="107" r="30" fill="#2c3f4d"/><circle cx="150" cy="57" r="14" fill="#2c3f4d"/><circle cx="150" cy="107" r="13" fill="#708b99"/>`,
    fitness: `<path d="M78 88h146" stroke="#c2d2d7" stroke-width="12"/><path d="M65 54h21v68H65zm151 0h21v68h-21Z" fill="${accent}"/><path d="M48 69h15v38H48zm191 0h15v38h-15Z" fill="#b1c4ce"/>`,
    bike: `<circle cx="78" cy="112" r="32" fill="none" stroke="${accent}" stroke-width="7"/><circle cx="229" cy="112" r="32" fill="none" stroke="${accent}" stroke-width="7"/><path d="M78 112l47-56 45 56H78l35-65m57 65 36-71 23 71m-33-75h23m-115 9h29" fill="none" stroke="#c0d4d6" stroke-width="6"/>`,
    bag: `<path d="M89 64h125l14 84H75Z" fill="${accent}"/><path d="M122 71V48q0-30 29-30t29 30v23" fill="none" stroke="${accent}" stroke-width="9"/>`,
    clothing: `<path d="M111 31l25-11q15 18 30 0l25 11 43 37-28 29-20-13v63h-73V84L93 97 66 68Z" fill="${accent}"/><path d="M136 21q15 18 30 0" fill="none" stroke="#d5e3e0" stroke-width="5"/>`,
    box: `<path d="M91 48h118v93H91Z" fill="${accent}"/><path d="M91 48l59-27 59 27-59 30Z" fill="#bacdd0"/><path d="M150 78v63" stroke="#2b414d" stroke-width="3"/>`,
  };
  return `<svg class="retail-art" viewBox="0 0 300 170" aria-hidden="true"><ellipse cx="150" cy="149" rx="116" ry="9" fill="#0002"/>${shapes[kind] || shapes.box}</svg>`;
}
