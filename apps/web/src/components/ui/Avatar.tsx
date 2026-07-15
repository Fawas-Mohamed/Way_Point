import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-[12px]", lg: "h-11 w-11 text-[15px]" };

// A small, deterministic palette derived from the initials keeps avatars
// visually distinct across a team roster without any per-user config.
const PALETTE = ["#3730A5", "#0F9D6E", "#D97706", "#64748B", "#1B2036"];

function colorFor(name: string): string {
  const index = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[index];
}

export function Avatar({ firstName, lastName, avatarUrl, size = "md", className }: AvatarProps) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        width={44}
        height={44}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-semibold text-white shrink-0", sizeMap[size], className)}
      style={{ backgroundColor: colorFor(firstName) }}
      title={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
