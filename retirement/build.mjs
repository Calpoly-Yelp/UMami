import {
   copyFile,
   mkdir,
   readdir,
   rm,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("./", import.meta.url));
const output = path.join(root, "dist");
if (path.dirname(output) !== path.resolve(root)) {
   throw new Error(
      "Artifact path must stay inside retirement/",
   );
}
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "frontend"), {
   recursive: true,
});
await mkdir(path.join(output, "api"), { recursive: true });

// An explicit file list keeps historical code, .env files and dependencies out.
for (const file of [
   "index.html",
   "notice.css",
   "staticwebapp.config.json",
]) {
   await copyFile(
      path.join(root, "frontend", file),
      path.join(output, "frontend", file),
   );
}
await copyFile(
   path.join(root, "api", "index.cjs"),
   path.join(output, "api", "index.js"),
);
await copyFile(
   path.join(root, "api", "package.json"),
   path.join(output, "api", "package.json"),
);
console.log(
   "Built keyless retirement artifacts:",
   await readdir(output),
);
