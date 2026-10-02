import { roleOf, type SignType } from "@/lib/catalog";

export interface Traits {
  frameThickness: number;
  metal: "primer" | "powder" | "aluminum";
  light: "none" | "exposed" | "internal" | "halo" | "frontlit" | "rgb";
  mount: "wall" | "bracket" | "pole" | "rooftop" | "hanging" | "raceway";
  material: "acrylic" | "stainless";
  backing: "clear" | "black";
}

const has = (s: string, re: RegExp) => re.test(s.toLowerCase());

export function deriveTraits(st: SignType, selections: Record<string, string>, thicknessIn = 2) : Traits {
  const pick = (role: string) => {
    const comp = st.components.find((c) => roleOf(c) === role);
    const opt = comp?.options.find((o) => o.id === selections[comp.id]) ?? comp?.options[0];
    return opt ? `${opt.id} ${opt.name}` : "";
  };
  const frame = pick("frame");
  const light = pick("lighting");
  const mount = pick("mounting");
  const face = pick("face");
  const finish = pick("finish");
  const backing = st.components.find((c) => c.id === "backing");
  const backingOpt = backing?.options.find((o) => o.id === selections[backing.id]) ?? backing?.options[0];

  const frameThickness = Math.max(0.04, thicknessIn / 12);
  const lightMode: Traits["light"] =
    !light || has(light, /\bnone\b|no light|without|non-?lit|daytime/) ? "none"
    : has(light, /halo|back-?lit/) && st.preview === "acrylic" ? "halo"
    : has(light, /face-?lit|front/) ? "frontlit"
    : has(light, /rgb/) ? "rgb"
    : has(light, /exposed/) ? "exposed"
    : "internal";

  const mountMode: Traits["mount"] = has(mount, /bracket/) ? "bracket" : has(mount, /pole|free/) ? "pole" : has(mount, /roof/) ? "rooftop" : has(mount, /hang|cable/) ? "hanging" : has(mount, /raceway/) ? "raceway" : "wall";

  return {
    frameThickness,
    metal: has(finish, /powder/) ? "powder" : has(frame, /alu/) ? "aluminum" : "primer",
    light: lightMode,
    mount: mountMode,
    material: has(face, /stainless|steel|metal/) ? "stainless" : "acrylic",
    backing: has(`${backingOpt?.id ?? ""} ${backingOpt?.name ?? ""}`, /black/) ? "black" : "clear",
  };
}
