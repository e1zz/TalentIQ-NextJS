import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the custom text-size utilities from app/globals.css
// (Figma text styles). Without this, `text-body` is read as a color and gets
// dropped when a text color class follows it in cn().
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["bar"],
      shadow: ["overlay"],
      tracking: ["overline"]
    },
    classGroups: {
      "font-size": [
        { text: ["page-title", "metric", "count", "card-title", "body", "meta"] }
      ]
    }
  }
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
