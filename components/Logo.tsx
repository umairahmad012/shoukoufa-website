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
        {/* Wordmark — sized up only at lg (1024+). At iPad portrait (md:768)
            the big size + wide tracking overflows into the Contact button,
            so we keep the sm size all the way through md and only let it
            grow at lg. */}
        <span
          className="text-[1.05rem] sm:text-[1.2rem] lg:text-[1.6rem] xl:text-[1.8rem] font-thin tracking-[0.12em] sm:tracking-[0.14em] lg:tracking-[0.18em] uppercase whitespace-nowrap"
          style={{ fontWeight: 200 }}
        >
          {displayName}
        </span>
        {/* Subline ("Real Estate Specialist") — only shows at lg+. At iPad
            it crowds the Contact button even when the wordmark is sized
            down, so we just don't show it. */}
        <span
          className="text-[0.55rem] xl:text-[0.68rem] font-light tracking-[0.32em] xl:tracking-[0.4em] uppercase opacity-90 mt-1 lg:mt-1.5 self-start lg:self-end whitespace-nowrap inline md:hidden lg:inline"
          style={{ fontWeight: 300 }}
        >
          {displayRole}
        </span>
      </span>
    </Link>
  );
}
