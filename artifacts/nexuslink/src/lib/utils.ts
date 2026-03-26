import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name?: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateGradient(id: string) {
  const colors = [
    ["from-blue-500", "to-indigo-500"],
    ["from-indigo-500", "to-purple-500"],
    ["from-purple-500", "to-pink-500"],
    ["from-pink-500", "to-rose-500"],
    ["from-emerald-500", "to-teal-500"],
    ["from-violet-500", "to-fuchsia-500"],
  ];
  
  // Simple deterministic selection based on string
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  
  return `bg-gradient-to-br ${colors[index][0]} ${colors[index][1]}`;
}
