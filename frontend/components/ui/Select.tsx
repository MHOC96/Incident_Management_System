"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  children?: ReactNode;
  hasError?: boolean;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  "aria-label"?: string;
};

function labelFromReactNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(labelFromReactNode).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return labelFromReactNode(node.props.children);
  }
  return "";
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const element = child as ReactElement<{
      value?: string;
      children?: ReactNode;
      disabled?: boolean;
    }>;

    if (element.type !== "option") {
      return;
    }

    options.push({
      value: String(element.props.value ?? ""),
      label: labelFromReactNode(element.props.children),
      disabled: element.props.disabled,
    });
  });

  return options;
}

function getPlaceholderLabel(options: SelectOption[]): string {
  const emptyOption = options.find((option) => option.value === "");
  if (emptyOption) {
    return emptyOption.label;
  }

  return options[0]?.label ?? "Select";
}

function matchesSearch(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.trim().toLowerCase());
}

const VIEWPORT_PADDING = 12;
const MENU_GAP = 4;
const MAX_MENU_HEIGHT = 288;

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  position: "fixed" | "absolute";
};

function computeMenuPosition(trigger: HTMLElement, portalRoot: HTMLElement): MenuPosition {
  const triggerRect = trigger.getBoundingClientRect();
  const portalToBody = portalRoot === document.body;
  const rootRect = portalToBody ? null : portalRoot.getBoundingClientRect();

  const spaceBelow = window.innerHeight - VIEWPORT_PADDING - triggerRect.bottom - MENU_GAP;
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING - MENU_GAP;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

  let maxHeight: number;
  let top: number;
  let left: number;

  if (openUp) {
    maxHeight = Math.min(MAX_MENU_HEIGHT, Math.max(96, spaceAbove));
    if (portalToBody) {
      top = Math.max(VIEWPORT_PADDING, triggerRect.top - MENU_GAP - maxHeight);
      maxHeight = Math.min(maxHeight, triggerRect.top - MENU_GAP - top);
      left = triggerRect.left;
    } else if (rootRect) {
      top = triggerRect.top - rootRect.top - MENU_GAP - maxHeight;
      top = Math.max(VIEWPORT_PADDING - rootRect.top, top);
      maxHeight = Math.min(maxHeight, triggerRect.top - rootRect.top - MENU_GAP - top);
      left = triggerRect.left - rootRect.left;
    } else {
      left = triggerRect.left;
      top = triggerRect.top - MENU_GAP - maxHeight;
    }
  } else {
    maxHeight = Math.min(MAX_MENU_HEIGHT, Math.max(96, spaceBelow));
    if (portalToBody) {
      top = triggerRect.bottom + MENU_GAP;
      const maxByViewport = window.innerHeight - VIEWPORT_PADDING - top;
      maxHeight = Math.min(maxHeight, maxByViewport);
      left = triggerRect.left;
    } else if (rootRect) {
      top = triggerRect.bottom - rootRect.top + MENU_GAP;
      const maxByViewport = window.innerHeight - VIEWPORT_PADDING - triggerRect.bottom - MENU_GAP;
      maxHeight = Math.min(maxHeight, maxByViewport);
      left = triggerRect.left - rootRect.left;
    } else {
      left = triggerRect.left;
      top = triggerRect.bottom + MENU_GAP;
    }
  }

  return {
    top,
    left,
    width: triggerRect.width,
    maxHeight: Math.max(96, maxHeight),
    position: portalToBody ? "fixed" : "absolute",
  };
}

export function Select({
  id,
  value,
  onChange,
  options,
  children,
  hasError = false,
  required = false,
  disabled = false,
  searchable,
  searchPlaceholder = "Search options...",
  className = "",
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchId = useId();
  const resolvedOptions = useMemo(
    () => options ?? optionsFromChildren(children),
    [options, children],
  );
  const selectableOptions = resolvedOptions.filter((option) => !option.disabled);
  const normalizedValue = String(value);
  const selected = resolvedOptions.find((option) => option.value === normalizedValue);
  const placeholder = getPlaceholderLabel(resolvedOptions);
  const displayLabel = selected?.label ?? placeholder;
  const showSearch = searchable ?? selectableOptions.length > 4;
  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) {
      return selectableOptions;
    }

    return selectableOptions.filter((option) => matchesSearch(option.label, searchQuery));
  }, [selectableOptions, searchQuery, showSearch]);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      setMenuPosition(null);
      setPortalRoot(null);
      return;
    }

    const dialog = containerRef.current.closest("dialog");
    const root = (dialog as HTMLElement | null) ?? document.body;
    setPortalRoot(root);

    function updatePosition() {
      if (!containerRef.current) {
        return;
      }
      setMenuPosition(computeMenuPosition(containerRef.current, root));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, showSearch, filteredOptions.length]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      return;
    }

    if (showSearch) {
      searchInputRef.current?.focus();
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, showSearch]);

  function emitChange(nextValue: string | number) {
    onChange({
      target: { value: String(nextValue) },
    } as ChangeEvent<HTMLSelectElement>);
  }

  const borderClass = hasError ? "border-danger" : "border-border";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        className={`flex h-11 w-full min-w-0 items-center justify-between rounded-[2px] border bg-surface px-3 text-left text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${borderClass}`}
      >
        <span className="truncate">{displayLabel}</span>
        <span aria-hidden="true" className="ml-2 shrink-0 text-text-muted">▾</span>
      </button>

      {open && menuPosition && portalRoot
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: menuPosition.position,
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
              }}
              className="z-[1000] flex min-h-0 flex-col overflow-hidden border border-border bg-surface shadow-sm"
            >
              {showSearch ? (
                <div className="shrink-0 border-b border-border p-2">
                  <label htmlFor={searchId} className="sr-only">
                    {searchPlaceholder}
                  </label>
                  <input
                    ref={searchInputRef}
                    id={searchId}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-[2px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && filteredOptions.length === 1) {
                        event.preventDefault();
                        emitChange(filteredOptions[0].value);
                        setOpen(false);
                      }
                    }}
                  />
                </div>
              ) : null}

              <ul
                id={listId}
                role="listbox"
                aria-label={ariaLabel ?? placeholder}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-text-secondary">No matching options.</li>
                ) : (
                  filteredOptions.map((option) => (
                    <li
                      key={option.value || "__empty__"}
                      role="option"
                      aria-selected={normalizedValue === option.value}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          emitChange(option.value);
                          setOpen(false);
                        }}
                        className={`flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-surface-hover ${
                          normalizedValue === option.value
                            ? "bg-primary/5 font-medium text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            portalRoot,
          )
        : null}
    </div>
  );
}
