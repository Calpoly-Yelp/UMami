import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readdir, readFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { requireSuccessfulRun } from "./deployment-gate.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));
await import("./build.mjs");

test("deployment requires current successful main runs, excluding fork and PR evidence", () => {
   const good = {
      id: 1,
      head_sha: "revision",
      event: "push",
      head_branch: "main",
      head_repository: { full_name: "Calpoly-Yelp/UMami" },
      status: "completed",
      conclusion: "success",
   };
   const verify = (runs) =>
      requireSuccessfulRun(
         runs,
         "Calpoly-Yelp/UMami",
         "revision",
      );
   verify([good]);
   for (const override of [
      { head_sha: "older" },
      { event: "pull_request" },
      { head_branch: "task" },
      {
         head_repository: {
            full_name: "elischiffler/UMami",
         },
      },
      { status: "in_progress" },
      { conclusion: "failure" },
      { conclusion: "skipped" },
   ]) {
      assert.throws(() =>
         verify([{ ...good, ...override }]),
      );
   }
   assert.throws(() => verify([]));
   assert.throws(() =>
      verify([
         good,
         { ...good, id: 2, conclusion: "failure" },
      ]),
   );
});

test("keyless deployed startup rejects reads, writes and tunnels without outbound activity", async (t) => {
   const child = spawn(
      process.execPath,
      ["--require", `${root}no-outbound.cjs`, "index.js"],
      {
         cwd: `${root}dist/api`,
         env: {
            PORT: "0",
            SystemRoot: process.env.SystemRoot || "",
         },
         stdio: ["ignore", "pipe", "pipe"],
      },
   );
   let errors = "";
   child.stderr.on("data", (chunk) => {
      errors += chunk;
   });
   t.after(async () => {
      child.kill();
      if (
         child.exitCode === null &&
         child.signalCode === null
      ) {
         await once(child, "exit");
      }
      assert.equal(errors, "");
   });
   const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
         () => reject(new Error("Startup timed out")),
         5000,
      );
      child.once("exit", (code) => {
         clearTimeout(timeout);
         reject(new Error(`Startup failed: ${code}`));
      });
      child.stdout.once("data", (chunk) => {
         clearTimeout(timeout);
         resolve(
            Number(String(chunk).match(/port (\d+)/)[1]),
         );
      });
   });
   const request = (method, path) =>
      new Promise((resolve, reject) => {
         const req = http.request(
            {
               hostname: "127.0.0.1",
               port,
               method,
               path,
               headers: {
                  Authorization: "Bearer private-sentinel",
                  Cookie: "session=private-sentinel",
                  Origin: "https://umami.elischiffler.dev",
               },
            },
            (res) => {
               let body = "";
               res.on("data", (chunk) => {
                  body += chunk;
               });
               res.on("end", () =>
                  resolve({
                     status: res.statusCode,
                     headers: res.headers,
                     body,
                  }),
               );
            },
         );
         req.on("error", reject);
         req.end(
            method === "POST"
               ? "private-sentinel"
               : undefined,
         );
      });
   const healthy = await request("GET", "/health");
   assert.equal(healthy.status, 200);
   assert.equal(JSON.parse(healthy.body).retired, true);
   for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
      "HEAD",
      "TRACE",
   ]) {
      for (const path of [
         "/",
         "/test-supabase",
         "/api/restaurants",
         "/health?token=private-sentinel",
         "/missing",
      ]) {
         const result = await request(method, path);
         assert.equal(
            result.status,
            410,
            `${method} ${path}`,
         );
         assert.equal(
            result.headers["cache-control"],
            "no-store",
         );
         assert.equal(result.headers.location, undefined);
         assert.equal(
            result.headers["access-control-allow-origin"],
            undefined,
         );
         assert.ok(
            !result.body.includes("private-sentinel"),
         );
         if (method !== "HEAD") {
            assert.equal(
               JSON.parse(result.body).replacement,
               "https://api.umami.elischiffler.dev",
            );
         }
      }
   }
   assert.equal(
      (await request("POST", "/health")).status,
      410,
   );
   assert.equal(
      (await request("HEAD", "/health")).status,
      200,
   );
   for (const raw of [
      "CONNECT destination:443 HTTP/1.1\r\nHost: destination\r\n\r\n",
      "GET / HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n",
   ]) {
      const result = await new Promise(
         (resolve, reject) => {
            const socket = net.connect(
               port,
               "127.0.0.1",
               () => socket.write(raw),
            );
            let body = "";
            socket.on("data", (chunk) => {
               body += chunk;
            });
            socket.on("end", () => resolve(body));
            socket.on("error", reject);
         },
      );
      assert.match(result, /^HTTP\/1.1 410 Gone/);
   }
   assert.equal(child.exitCode, null);
   assert.deepEqual(await readdir(`${root}dist/api`), [
      "index.js",
      "package.json",
   ]);
});

test("frontend artifact contains only a static notice and blocks legacy routes", async () => {
   assert.deepEqual(await readdir(`${root}dist/frontend`), [
      "index.html",
      "notice.css",
      "staticwebapp.config.json",
   ]);
   const html = await readFile(
      `${root}dist/frontend/index.html`,
      "utf8",
   );
   assert.match(
      html,
      /href="https:\/\/umami\.elischiffler\.dev"\s+rel="noreferrer"/,
   );
   assert.doesNotMatch(
      html,
      /<script|<form|<iframe|http-equiv|supabase|VITE_|azurewebsites/i,
   );
   const config = JSON.parse(
      await readFile(
         `${root}dist/frontend/staticwebapp.config.json`,
         "utf8",
      ),
   );
   assert.equal(
      config.navigationFallback.rewrite,
      "/index.html",
   );
   assert.equal(
      config.globalHeaders["Cache-Control"],
      "no-store",
   );
   assert.match(
      config.globalHeaders["Content-Security-Policy"],
      /script-src 'none'; connect-src 'none'/,
   );
   for (const route of [
      "/assets/*",
      "/static/*",
      "/api/*",
      "/service-worker.js",
   ]) {
      assert.equal(
         config.routes.find((item) => item.route === route)
            .statusCode,
         410,
      );
      assert.ok(
         config.navigationFallback.exclude.includes(route),
      );
   }
});
