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
  extend: {
    colors: {
      alpha: {
        gray: {
          10: '#E0E0E0', // Replace with your desired gray shade
          5: '#F5F5F5',  // Add other required shades
        },
        accent: {
          10: '#FFEEEE', // Define accent colors if needed
          20: '#FFCCCC',
        },
        red: {
          10: '#FFE5E5',
          20: '#FFB3B3',
        },
        white: {
          10: 'rgba(255, 255, 255, 0.1)',
          5: 'rgba(255, 255, 255, 0.05)',
          80: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
  },
} satisfies Config;
