import Link from "next/link";
import { cn } from "@/lib/cn";
import { site as staticSite } from "@/lib/site";

export default function Logo({
  variant = "light",
  className,
  portraitAvatar,
  name,
  role,
}: {
  variant?: "light" | "dark";
  className?: string;
  portraitAvatar?: string;
  /** Realtor name from settings; falls back to static default. */
  name?: string;
  /** Realtor role from settings; falls back to static default. */
  role?: string;
}) {
  const avatar = portraitAvatar || staticSite.portrait.avatar;
  const displayName = name || staticSite.name;
  const displayRole = role || staticSite.role;
  const isLight = variant === "light";
  const color = isLight ? "text-white" : "text-ink";
  const ringColor = isLight ? "ring-white/40" : "ring-ink/15";

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 sm:gap-4 leading-none min-w-0", color, className)}
      aria-label={`${displayName} — Home`}
    >
      {/* Circular portrait — left of wordmark */}
      <span
        className={cn(
          "relative inline-block w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full overflow-hidden ring-1 transition-all duration-500 ease-editorial flex-shrink-0",
          ringColor,
        )}
      >
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${avatar}')` }}
          aria-hidden="true"
        />
      </span>

      <span className="flex flex-col min-w-0">
        <span
          className="text-[1.05rem] sm:text-[1.3rem] md:text-[1.8rem] font-thin tracking-[0.12em] sm:tracking-[0.15em] md:tracking-[0.18em] uppercase whitespace-nowrap"
          style={{ fontWeight: 200 }}
        >
          {displayName}
        </span>
        <span
          className="text-[0.5rem] sm:text-[0.55rem] md:text-[0.68rem] font-light tracking-[0.32em] sm:tracking-[0.36em] md:tracking-[0.42em] uppercase opacity-90 mt-1 md:mt-1.5 self-end whitespace-nowrap hidden md:inline"
          style={{ fontWeight: 300 }}
        >
          {displayRole}
        </span>
      </span>
    </Link>
  );
}
