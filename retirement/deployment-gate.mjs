import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export function requireSuccessfulRun(
   runs,
   repository,
   revision,
) {
   const latest = runs
      .filter(
         (run) =>
            run.head_sha === revision &&
            run.event === "push" &&
            run.head_branch === "main" &&
            run.head_repository?.full_name === repository,
      )
      .sort((a, b) => b.id - a.id)[0];
   assert.ok(
      latest?.status === "completed" &&
         latest.conclusion === "success",
      "Required main CI is missing, incomplete or unsuccessful",
   );
}

async function main() {
   const repository = process.env.GITHUB_REPOSITORY;
   const revision = process.env.GITHUB_SHA;
   assert.equal(repository, "Calpoly-Yelp/UMami");
   assert.equal(process.env.GITHUB_REF, "refs/heads/main");
   assert.match(revision || "", /^[a-f0-9]{40}$/);
   assert.ok(
      process.env.GH_TOKEN,
      "GitHub read token is required",
   );
   const read = async (path) => {
      const response = await fetch(
         `https://api.github.com/repos/${repository}/${path}`,
         {
            headers: {
               Authorization: `Bearer ${process.env.GH_TOKEN}`,
               Accept: "application/vnd.github+json",
            },
            signal: AbortSignal.timeout(20000),
         },
      );
      assert.equal(
         response.status,
         200,
         "GitHub verification failed",
      );
      return response.json();
   };
   const mainBranch = await read("branches/main");
   assert.equal(
      mainBranch.commit.sha,
      revision,
      "A newer main commit exists",
   );
   for (const workflow of [
      "ci-testing.yml",
      "cypress.yml",
   ]) {
      const result = await read(
         `actions/workflows/${workflow}/runs?head_sha=${revision}&event=push&branch=main&per_page=100`,
      );
      requireSuccessfulRun(
         result.workflow_runs,
         repository,
         revision,
      );
      console.log(
         `PASS required main check ${workflow} at ${revision}`,
      );
   }
}

if (
   process.argv[1] &&
   import.meta.url === pathToFileURL(process.argv[1]).href
) {
   await main();
}
