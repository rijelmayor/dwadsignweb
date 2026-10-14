"use client";

import { useEffect, useRef, useState } from "react";
import { LEN_UNITS, trimNum, type LenUnit } from "@/lib/units";

interface Props {
  label: string;
  /** Value in the app's base unit (feet for sizes, inches for depth). */
  value: number;
  unit: LenUnit;
  onUnit: (u: LenUnit) => void;
  /** base → typed unit, typed unit → base */
  fromBase: (base: number, u: LenUnit) => number;
  toBase: (v: number, u: LenUnit) => number;
  onChange: (base: number) => void;
  /** Applied on blur (base unit). */
  minBase?: number;
  /** Applied while typing and on blur (base unit). */
  maxBase?: number;
  hint?: string;
  inputCls: string;
  labelCls: string;
}

/**
 * Number field with its own unit picker (ft / inch / cm / mm).
 * Keeps a text draft so the field can be cleared and typed freely, converts to the base unit
 * on every keystroke, and re-formats the draft when the unit is switched.
 */
export default function UnitField({ label, value, unit, onUnit, fromBase, toBase, onChange, minBase = 0, maxBase, hint, inputCls, labelCls }: Props) {
  const [draft, setDraft] = useState(trimNum(fromBase(value, unit)));
  const lastUnit = useRef(unit);

  // Resync the draft when the value changes from outside (presets, letters box) or the unit is switched.
  useEffect(() => {
    const shown = parseFloat(draft);
    const sameValue = Number.isFinite(shown) && Math.abs(toBase(shown, unit) - value) <= Math.max(1e-6, Math.abs(value) * 1e-6);
    if (lastUnit.current !== unit || !sameValue) {
      if (!(draft === "" && lastUnit.current === unit)) setDraft(trimNum(fromBase(value, unit)));
    }
    lastUnit.current = unit;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, unit]);

  const type = (raw: string) => {
    const clean = raw.replace(/[^0-9.]/g, "");
    setDraft(clean);
    const n = parseFloat(clean);
    if (!Number.isFinite(n) || n <= 0) return;
    let base = toBase(n, unit);
    if (maxBase !== undefined) base = Math.min(maxBase, base);
    onChange(base);
  };

  const blur = () => {
    const n = parseFloat(draft);
    let base = Number.isFinite(n) && n > 0 ? toBase(n, unit) : value;
    base = Math.max(minBase, base);
    if (maxBase !== undefined) base = Math.min(maxBase, base);
    onChange(base);
    setDraft(trimNum(fromBase(base, unit)));
  };

  return (
    <div>
      <label className={labelCls}>{label}{hint ? ` · ${hint}` : ""}</label>
      <div className="flex gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => type(e.target.value)}
          onBlur={blur}
          placeholder="0"
          className={`${inputCls} min-w-0`}
        />
        <select
          aria-label={`${label} unit`}
          value={unit}
          onChange={(e) => onUnit(e.target.value as LenUnit)}
          className="rounded-xl border border-line bg-panel px-2 text-sm text-white focus:border-teal outline-none"
        >
          {LEN_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </div>
    </div>
  );
}
