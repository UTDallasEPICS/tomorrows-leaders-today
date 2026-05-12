"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = date.getTime();
  return t > from.getTime() && t < to.getTime();
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [hovered, setHovered] = useState<Date | null>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 420;
    const dropdownWidth = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;

    const top =
      spaceBelow >= dropdownHeight
        ? rect.bottom + 6
        : rect.top - dropdownHeight - 6;

    const left =
      spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth;

    setDropdownStyle({
      position: "fixed",
      top,
      left,
      width: dropdownWidth,
      zIndex: 9999,
    });

    setOpen(true);
    setPicking(value.from ? "to" : "from");
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function handleDayClick(date: Date) {
    if (picking === "from") {
      const newTo = value.to && date > value.to ? null : value.to;
      onChange({ from: date, to: newTo });
      setPicking("to");
    } else {
      if (value.from && date < value.from) {
        onChange({ from: date, to: value.from });
      } else {
        onChange({ from: value.from, to: date });
      }
      setPicking("from");
      setOpen(false);
    }
  }

  function clearRange() {
    onChange({ from: null, to: null });
    setPicking("from");
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: totalDays },
      (_, i) => new Date(viewYear, viewMonth, i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const previewTo = picking === "to" && hovered ? hovered : value.to;
  const hasValue = value.from || value.to;

  let triggerText = "Select date range";
  if (value.from && value.to)
    triggerText = `${formatDate(value.from)} – ${formatDate(value.to)}`;
  else if (value.from) triggerText = `From ${formatDate(value.from)}`;
  else if (value.to) triggerText = `Until ${formatDate(value.to)}`;

  const calendar = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#B89A49]">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-black/10 text-white transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-black/10 text-white transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-2 pb-1">
        <p className="text-[10px] text-[#B89A49] font-semibold uppercase tracking-wider text-center">
          {picking === "from" ? "Select start date" : "Select end date"}
        </p>
      </div>

      <div className="grid grid-cols-7 px-3">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;

          const isFrom = value.from && isSameDay(date, value.from);
          const isTo = value.to && isSameDay(date, value.to);
          const isInRange = inRange(date, value.from, previewTo);
          const isToday = isSameDay(date, today);
          const isPreviewEnd =
            picking === "to" && hovered && isSameDay(date, hovered);

          let cls =
            "relative flex items-center justify-center h-7 text-xs cursor-pointer select-none transition-all rounded ";
          if (isFrom || isTo) cls += "bg-[#B89A49] text-white font-bold z-10 ";
          else if (isPreviewEnd)
            cls += "bg-[#B89A49]/40 text-[#7a5c10] font-semibold ";
          else if (isInRange)
            cls += "bg-[#B89A49]/15 text-[#7a5c10] rounded-none ";
          else if (isToday)
            cls += "text-[#B89A49] font-bold hover:bg-[#B89A49]/10 ";
          else cls += "text-gray-700 hover:bg-[#B89A49]/10 ";

          return (
            <div
              key={date.toISOString()}
              className={cls}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => setHovered(date)}
              onMouseLeave={() => setHovered(null)}
            >
              {date.getDate()}
              {isToday && !isFrom && !isTo && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#B89A49]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 px-3 py-2 flex flex-wrap gap-1.5">
        {[
          { label: "Next 30d", days: 30 },
          { label: "Next 90d", days: 90 },
          { label: "Next 6mo", days: 180 },
          { label: "Next year", days: 365 },
        ].map(({ label, days }) => (
          <button
            key={label}
            onClick={() => {
              const from = new Date();
              const to = new Date();
              to.setDate(to.getDate() + days);
              onChange({ from, to });
              setPicking("from");
              setOpen(false);
            }}
            className="px-2 py-1 text-[10px] font-medium rounded border border-gray-200 text-gray-600 hover:bg-[#B89A49]/10 hover:border-[#B89A49]/40 hover:text-[#7a5c10] transition-all"
          >
            {label}
          </button>
        ))}
        {hasValue && (
          <button
            onClick={() => {
              clearRange();
              setOpen(false);
            }}
            className="px-2 py-1 text-[10px] font-medium rounded border border-red-200 text-red-500 hover:bg-red-50 transition-all ml-auto"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        onClick={openPicker}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 cursor-pointer transition-all select-none ${
          open
            ? "border-[#B89A49] bg-[#fdf8ee]"
            : hasValue
              ? "border-[#B89A49]/60 bg-[#fdf8ee]/60 hover:border-[#B89A49]"
              : "border-gray-200 bg-white hover:border-[#B89A49]/40"
        }`}
      >
        <Calendar className="w-4 h-4 text-[#B89A49] flex-shrink-0" />
        <span
          className={`flex-1 text-xs truncate ${hasValue ? "text-[#7a5c10] font-medium" : "text-gray-400"}`}
        >
          {triggerText}
        </span>
        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearRange();
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear date range"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(calendar, document.body)}
    </div>
  );
}
