import backendConfig from "../backend/eslint.config.js";

export default backendConfig.map((config) => ({
   ...config,
   files: ["retirement/**/*.{mjs,cjs}"],
}));
