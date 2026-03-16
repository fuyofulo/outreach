"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

export function CustomSelect({
  name,
  options,
  defaultValue = "",
  value,
  onValueChange,
  placeholder = "Select",
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;

  const selected = useMemo(
    () => options.find((option) => option.value === currentValue),
    [options, currentValue],
  );

  function readMenuPosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      return;
    }

    function syncMenuPosition() {
      const nextPosition = readMenuPosition();
      if (!nextPosition) {
        return;
      }

      setMenuStyle(nextPosition);
    }

    syncMenuPosition();
    window.addEventListener("resize", syncMenuPosition);
    window.addEventListener("scroll", syncMenuPosition, true);

    return () => {
      window.removeEventListener("resize", syncMenuPosition);
      window.removeEventListener("scroll", syncMenuPosition, true);
    };
  }, [open]);

  function selectValue(nextValue: string) {
    if (!controlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="custom-select">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        type="button"
        className="field custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }

          const nextPosition = readMenuPosition();
          if (nextPosition) {
            setMenuStyle(nextPosition);
          }
          setOpen(true);
        }}
      >
        <span className={selected ? "" : "text-stone-500"}>{selected?.label ?? placeholder}</span>
      </button>
      {open && menuStyle ? (
        <div
          className="custom-select-menu retro-window"
          style={{
            position: "fixed",
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
          }}
        >
          <div className="retro-pattern p-0">
            <ul className="custom-select-scroll max-h-56 overflow-auto" role="listbox">
              {options.map((option) => {
                const isSelected = option.value === currentValue;

                return (
                  <li key={`${option.value}-${option.label}`}>
                    <button
                      type="button"
                      className={`custom-select-option ${isSelected ? "custom-select-option-active" : ""}`}
                      onClick={() => selectValue(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
