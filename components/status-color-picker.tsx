"use client";

import { useState } from "react";

import {
  DEFAULT_STATUS_COLOR,
  STATUS_COLOR_PRESETS,
} from "@/lib/constants";
import { normalizeStatusColor } from "@/lib/utils";

type StatusColorPickerProps = {
  defaultValue?: string | null;
};

export function StatusColorPicker({
  defaultValue = DEFAULT_STATUS_COLOR,
}: StatusColorPickerProps) {
  const [value, setValue] = useState(normalizeStatusColor(defaultValue));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          aria-label="Status color"
          className="h-10 w-16 cursor-pointer border border-stone-950/25 bg-white p-1"
          name="color"
          type="color"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
          {value}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Use color ${preset}`}
            className="h-7 w-7 border border-stone-950/20"
            style={{ backgroundColor: preset }}
            onClick={() => setValue(preset)}
          />
        ))}
      </div>
    </div>
  );
}
