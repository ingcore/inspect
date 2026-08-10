import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Odoo-Modul: gespiegelter Kern und Odoo-eigene Modulsyntax
    // (@odoo-module, @web/..., @odoo/owl). Die Quelle liegt in
    // safety-navigator/core und wird dort mitgeprueft.
    "safety-navigator/odoo/**",
  ]),
]);

export default eslintConfig;
