import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
   {
      files: ["**/*.js"],
      ignores: [
         "node_modules/**",
         "dist/**",
         "build/**",
         "coverage/**",
      ],

      extends: [js.configs.recommended],

      languageOptions: {
         ecmaVersion: "latest",
         sourceType: "module",
         globals: globals.node,
      },

      env: {
        jest: true,
      },

      rules: {
         "no-console": "off",
         "no-process-exit": "off",
         "no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
         ],
         eqeqeq: ["error", "always"],
         curly: ["error", "all"],
      },
   },
]);
