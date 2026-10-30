import React from "react";

interface Y2KWindowProps {
  title: string;
  accent?: "pink" | "cyan" | "lime";
  badge?: string;
  sticker?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Y2KWindow({
  title,
  accent = "cyan",
  badge,
  sticker = "🍀",
  children,
  className = "",
}: Y2KWindowProps) {
  const accentStyles = {
    pink: {
      headerBg: "bg-[#FEF08A]",
      badgeBg: "bg-[#D1FAE5] text-[#065F46]",
    },
    cyan: {
      headerBg: "bg-[#BAE6FD]",
      badgeBg: "bg-[#D1FAE5] text-[#065F46]",
    },
    lime: {
      headerBg: "bg-[#D1FAE5]",
      badgeBg: "bg-[#FEF08A] text-[#4A3531]",
    },
  }[accent];

  return (
    <section
      className={`gingham-cloud-card flex flex-col overflow-visible relative ${className}`}
    >
      {/* Puffy Cloud Header Banner with Warm Cocoa Outline */}
      <div
        className={`${accentStyles.headerBg} mx-4 -mt-4 px-5 py-2.5 rounded-full border-[3px] border-[#4A3531] flex flex-wrap items-center justify-between gap-2 shadow-[0_4px_0_#4A3531]`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{sticker}</span>
          <h2 className="cozy-subtitle text-[#4A3531] text-base md:text-lg tracking-wide truncate">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span
              className={`text-xs font-extrabold px-3 py-0.5 rounded-full border-2 border-[#4A3531] ${accentStyles.badgeBg} uppercase`}
            >
              ✦ {badge}
            </span>
          )}
          <span className="text-[#F59E0B] text-base">✦</span>
        </div>
      </div>

      {/* Gingham Cloud Body */}
      <div className="p-5 md:p-6 flex-1 text-[#4A3531]">{children}</div>
    </section>
  );
}
