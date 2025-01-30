import baseConfig from "@midday/ui/tailwind.config";
import iconifyPlugin from '@iconify/tailwind';
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/invoice/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  plugins: [
    require("@todesktop/tailwind-variants"),
    iconifyPlugin,
  ],
} satisfies Config;
