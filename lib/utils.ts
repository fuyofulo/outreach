type RawInput = FormDataEntryValue | string | null | undefined;

function normalizeRawInput(raw: RawInput) {
  if (typeof raw === "string") {
    return raw.trim();
  }

  return raw?.toString().trim() ?? "";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function parseMetadata(raw: RawInput) {
  const value = normalizeRawInput(raw);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to key:value parsing.
  }

  const pairs = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.includes(":")
        ? line.indexOf(":")
        : line.indexOf("=");

      if (separatorIndex === -1) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const parsedValue = line.slice(separatorIndex + 1).trim();

      if (!key || !parsedValue) {
        return null;
      }

      return [key, parsedValue] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return pairs.length ? Object.fromEntries(pairs) : null;
}

export function metadataToText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  return Object.entries(value).map(([key, entry]) => {
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      return `${key}: ${entry}`;
    }

    return `${key}: ${JSON.stringify(entry)}`;
  }).join("\n");
}

export function parseDateInput(raw: RawInput) {
  const value = normalizeRawInput(raw);
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export function formatDate(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(options ?? {}),
  }).format(date);
}

export function dateInputValue(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function dateTimeInputValue(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 19);
}

export function parseTags(raw: RawInput) {
  const value = normalizeRawInput(raw);

  return [...new Set(
    value
      .split(/[\n,]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )];
}

export function textValue(raw: RawInput) {
  const value = normalizeRawInput(raw);
  return value ? value : null;
}

export function numberValue(raw: RawInput, fallback: number) {
  const value = Number(normalizeRawInput(raw));
  return Number.isFinite(value) ? value : fallback;
}

const LEGACY_STATUS_COLORS: Record<string, string> = {
  slate: "#dde7fb",
  teal: "#bde640",
  blue: "#2f68ff",
  amber: "#ffb357",
  emerald: "#3ed8ff",
  rose: "#ff4fc7",
};

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(color: string) {
  const normalized = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColor(base: string, target: string, weight: number) {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) {
    return base;
  }

  return rgbToHex(
    baseRgb.r + (targetRgb.r - baseRgb.r) * weight,
    baseRgb.g + (targetRgb.g - baseRgb.g) * weight,
    baseRgb.b + (targetRgb.b - baseRgb.b) * weight,
  );
}

export function normalizeStatusColor(color: string | null | undefined) {
  const value = (color ?? "").trim().toLowerCase();
  if (LEGACY_STATUS_COLORS[value]) {
    return LEGACY_STATUS_COLORS[value];
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  return LEGACY_STATUS_COLORS.slate;
}

export function statusBadgeStyle(color: string) {
  const base = normalizeStatusColor(color);
  const start = mixColor(base, "#ffffff", 0.38);
  const end = mixColor(base, "#000000", 0.08);
  const rgb = hexToRgb(base) ?? { r: 221, g: 231, b: 251 };
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return {
    backgroundImage: `linear-gradient(180deg, ${start} 0%, ${end} 100%)`,
    color: luminance > 0.67 ? "#16346f" : "#ffffff",
    borderColor: mixColor(base, "#ffffff", 0.45),
    boxShadow: `1px 1px 0 ${mixColor(base, "#000000", 0.4)}`,
  };
}

export function buildQueryString(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}
