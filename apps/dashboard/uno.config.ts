import { defineConfig, presetIcons, presetUno, presetAttributify } from "unocss";
import type { IconifyJSON } from "@iconify/types";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        ph: async () => {
          const data = await import("@iconify-json/ph/icons.json", { assert: { type: "json" } });
          return data.default as IconifyJSON;
        }
      },
    }),
  ],
});
