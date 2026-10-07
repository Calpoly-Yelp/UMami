# UMami historical repository and Azure retirement

The current application lives in `elischiffler/UMami`. This repository keeps
the historical application; do not copy the personal application back here.

Use Node.js 24 and committed npm lockfiles. From the repository root install
with `npm ci`, `npm ci --prefix frontend`, and `npm ci --prefix backend`.
Required checks are `npm run format:check`, `npm run lint`, `npm test`,
`npm --prefix frontend run build`, and `npm run retirement:browser`.
For the historical build use `VITE_SUPABASE_URL=https://fixture.invalid`
and `VITE_SUPABASE_ANON_KEY=fixture-only-build-key`; this output is never deployed.
Install the browser with the backend's Playwright CLI if needed.

`retirement/build.mjs` owns the deployed file allowlist.
`retirement/api/index.cjs` must remain independent of historical routers,
Supabase, dotenv and schedulers. Only its generated two-file package may
be deployed to Azure. The moved notice has no JavaScript or database access.
Keep the local preview fixture separate from actual Azure acceptance.

Azure workflows are manual, organization-only, main-only, and require
successful checks on the latest main SHA. PRs and main pushes must never
deploy Azure. The user approves merges and manual retirement deployments.
Do not change credentials, provider security settings, or Azure resources
under ordinary implementation authorization.

Follow [the retirement runbook](docs/azure-retirement.md).
Record evidence and unresolved gates in [validation](docs/validation.md).
Keepalive ownership and independently configured Azure jobs require a
separate inventory. Preserve the personal fork's Vercel/EC2 delivery.
