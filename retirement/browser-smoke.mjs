import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
   new URL("../backend/package.json", import.meta.url),
);
const { chromium } = require("playwright");
await import("./build.mjs");
const preview = spawn(
   process.execPath,
   [
      fileURLToPath(
         new URL("./preview.mjs", import.meta.url),
      ),
   ],
   {
      env: {
         PORT: "0",
         SystemRoot: process.env.SystemRoot || "",
      },
      stdio: ["ignore", "pipe", "inherit"],
   },
);
let browser;
try {
   const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
         () =>
            reject(new Error("Preview startup timed out")),
         5000,
      );
      preview.once("exit", (code) => {
         clearTimeout(timeout);
         reject(new Error(`Preview failed: ${code}`));
      });
      preview.stdout.once("data", (chunk) => {
         clearTimeout(timeout);
         resolve(
            Number(String(chunk).match(/port (\d+)/)[1]),
         );
      });
   });
   browser = await chromium.launch({ headless: true });
   const context = await browser.newContext();
   const page = await context.newPage();
   const requests = [];
   const errors = [];
   page.on("request", (request) => requests.push(request));
   page.on("pageerror", (error) =>
      errors.push(error.message),
   );
   for (const path of [
      "/",
      "/restaurants/123?token=private-sentinel#access_token=private-sentinel",
   ]) {
      await page.goto(`http://127.0.0.1:${port}${path}`);
      assert.equal(
         await page.locator("h1").innerText(),
         "We have moved.",
      );
      assert.equal(
         await page.locator("a").getAttribute("href"),
         "https://umami.elischiffler.dev",
      );
      assert.equal(
         await page.locator("script, form, iframe").count(),
         0,
      );
      assert.equal(
         await page.evaluate(() =>
            navigator.serviceWorker
               .getRegistrations()
               .then((items) => items.length),
         ),
         0,
      );
   }
   assert.deepEqual(errors, []);
   assert.ok(
      requests.every(
         (request) =>
            new URL(request.url()).origin ===
            `http://127.0.0.1:${port}`,
      ),
   );
   assert.ok(
      requests.every((request) =>
         ["document", "stylesheet"].includes(
            request.resourceType(),
         ),
      ),
   );
   console.log(
      "PASS clean-browser root/deep notice, fixed link, no scripts or outbound requests",
   );
} finally {
   await browser?.close();
   preview.kill();
   if (
      preview.exitCode === null &&
      preview.signalCode === null
   ) {
      await once(preview, "exit");
   }
}
