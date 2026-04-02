import nextVitals from "eslint-config-next/core-web-vitals";

/** Avoid linting generated bundles (fixes spurious “6+ errors” from `.next`). */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "dist/**", ".claude/**"],
  },
  ...nextVitals,
];

export default config;
