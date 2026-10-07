import assert from "node:assert/strict";

const target = process.argv[2];
assert.ok(
   ["frontend", "api"].includes(target),
   "Choose frontend or api",
);
const base =
   target === "frontend"
      ? "https://thankful-hill-0f3846d10.7.azurestaticapps.net"
      : "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net";
const paths =
   target === "frontend"
      ? [
           "/",
           "/restaurants/retirement-check",
           "/assets/index-L8RPGIiR.js",
           "/assets/retirement-check.js",
           "/service-worker.js",
        ]
      : [
           "/health",
           "/",
           "/test-supabase",
           "/api/restaurants",
        ];
for (const path of paths) {
   const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
   });
   const blockedAsset =
      target === "frontend" &&
      (path.startsWith("/assets/") ||
         path === "/service-worker.js");
   const expected =
      target === "api"
         ? path === "/health"
            ? 200
            : 410
         : blockedAsset
           ? 410
           : 200;
   assert.equal(
      response.status,
      expected,
      `Unexpected status at ${path}`,
   );
   assert.equal(
      response.headers.get("cache-control"),
      "no-store",
      `Unexpected cache policy at ${path}`,
   );
   if (target === "api") {
      const body = await response.json();
      assert.equal(body.retired, true);
      assert.equal(
         body.replacement,
         "https://api.umami.elischiffler.dev",
      );
      assert.equal(response.headers.get("location"), null);
      assert.equal(
         response.headers.get(
            "access-control-allow-origin",
         ),
         null,
      );
   } else if (!blockedAsset) {
      const body = await response.text();
      assert.match(body, /We have moved\./);
      assert.match(
         body,
         /href="https:\/\/umami\.elischiffler\.dev"/,
      );
      assert.doesNotMatch(
         body,
         /<script|<form|supabase|VITE_/i,
      );
      assert.ok(
         response.headers
            .get("content-security-policy")
            ?.includes("connect-src 'none'"),
      );
   }
   console.log(`PASS ${target} ${path} (${expected})`);
}
