import baseConfig from "@midday/ui/tailwind.config";
import type { Config } from "tailwindcss";
import { addDynamicIconSelectors } from '@iconify/tailwind'
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/invoice/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  plugins: [
    require("@todesktop/tailwind-variants"),
    addDynamicIconSelectors(),
  ],
} satisfies Config;
