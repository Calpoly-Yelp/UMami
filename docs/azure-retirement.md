# Azure retirement

This release prepares code retirement of the historical organization deployment.
Deployment, Supabase access invalidation, and Azure resource deletion are
separate gates. Current evidence is in [validation.md](validation.md).

## Artifacts and local checks

Use Node.js 24. Install all three committed dependency trees with
`npm ci`, `npm ci --prefix frontend`, and `npm ci --prefix backend`.
Run `npm run format:check`, `npm run lint`, `npm test`, and
`npm --prefix frontend run build` from the root. Set the historical build's
`VITE_SUPABASE_URL` to `https://fixture.invalid` and
`VITE_SUPABASE_ANON_KEY` to `fixture-only-build-key`.
Never supply production credentials to these checks.

`npm run retirement:build` regenerates `retirement/dist/` from an explicit
file list. The frontend has only HTML, CSS and Static Web Apps configuration.
It shows an explicit link to the new homepage, without copying query strings,
fragments or referrers. CSP disables scripts, connections, frames and forms.
Deep routes fall back to the notice; legacy assets and API routes return 410.

The API artifact has only `index.js` and `package.json`.
It uses Node's HTTP server, reads only `PORT`, and has no installed dependencies.
GET/HEAD `/health` return 200 with `retired: true`. Other routes and methods
return 410, including CONNECT and protocol upgrades. Responses contain a fixed
replacement URL and never redirect credentials or writes.

`npm run retirement:test` starts the actual packaged server with Supabase
variables absent, blocks outbound connections/DNS/HTTP/fetch and interval
schedules, and checks reads, writes, tunnels, headers and non-disclosure.
Its only permitted lookup is Node's numeric local bind address.

Use `backend/node_modules/.bin/playwright install chromium` on POSIX or
`backend\node_modules\.bin\playwright.cmd install chromium` on Windows
if Chromium is missing. `npm run retirement:browser` verifies root and
token-bearing deep links in a clean browser, fixed link targets, no scripts,
no service workers, and no external requests. The local preview is a fixture,
not evidence of Azure routing, deployment deletion semantics or cache behavior.
To inspect it interactively run `npm run retirement:build`, then
`npm run retirement:preview`, and open `http://127.0.0.1:8089`.

## Review and deliberate deployment

1. Review and approve the PR. This changes the organization's delivery policy:
   merging it disables automatic Azure publishing. A merge does not publish the
   notice or the API. Historical unit tests remain; the credential-dependent
   Cypress PR job becomes a credential-free retirement browser check.
2. Wait for both `CI Testing` and `Retirement browser smoke` on the merged main
   commit. Branch protection was absent at baseline; the manual workflows
   enforce successful checks in code using exact SHA, push event, main branch
   and organization repository evidence.
3. Verify the new frontend and API, authenticated journeys, and current worker.
   Obtain explicit approval to deploy the notice and API to the named old hosts.
4. From the organization's Actions UI run `Retire Azure frontend` on main,
   entering `retire-azure-frontend`, and `Retire Azure API`, entering
   `retire-azure-api`. They reuse existing Azure deployment identities,
   test/build the keyless artifacts and refuse stale main commits.
   Both share a concurrency group without cancelling a running deployment.
   No new deployment credentials are provisioned.
5. Follow both runs to completion. Each runs a bounded, read-only public
   verification. A green upload alone is insufficient. Repeat
   `node retirement/verify-live.mjs frontend` and
   `node retirement/verify-live.mjs api` from the exact deployed checkout.
   Do not run production write probes against the old app before retirement.
6. Use a clean browser on the old root and deep links. Confirm the notice,
   fixed new-site link, CSP, no Supabase/API activity, no obsolete JS, and
   cache behavior. Verify the baseline old asset `/assets/index-L8RPGIiR.js`
   returns 410. An already-open old browser or cached bundle may still hold
   code and public configuration; only data-access revocation closes that gate.
7. Record deployment run URLs, exact SHAs and public checks. After verification,
   the obsolete workflow paths can be disabled through an approved GitHub
   administration action. Their checked-in versions are already manual-only
   and cannot package historical application code.

If Azure authentication or upload fails, stop and diagnose. Do not restore
automatic historical deployments, mint new identities or supply a new
production key to the old Azure account.

## Data access retirement

Removing source references or workflow variables does not remove Azure runtime
settings or invalidate their credentials. A tombstone response does not prove
revocation. Inventory consumers before choosing a key operation:

| Consumer                              | Evidence needed before revocation                                   |
| ------------------------------------- | ------------------------------------------------------------------- |
| Current frontend                      | Project, public key type, auth/session and RLS acceptance           |
| Current API                           | Project, server key identifier/type, authenticated ownership checks |
| Current worker                        | Project/key identifier, actual schedule and health, successful work |
| Old Azure API                         | Exact old key identifier/type and provider confirmation of sharing  |
| CI, keepalive, integrations, webhooks | Purpose, credential identifiers and replacement plan                |

Store only identifiers/types and consumer ownership in review artifacts; never
secret values. Azure account access is unavailable, so an owner must identify
runtime secrets, startup overrides, slots and independent WebJobs/schedules.
The keepalive workflow is unchanged and was already disabled for inactivity;
do not re-enable or delete it until its shared-project purpose is established.

For an independently managed `sb_secret_` key, migrate every legitimate shared
consumer, verify them, then obtain exact approval for irreversible deletion of
the identified old key. For legacy JWT keys, migrate all consumers first and
separately approve deactivation of the legacy anon/service-role set.
Creating replacement keys leaves old keys valid. Avoid an unrelated JWT signing
secret rotation; API-key and session signing-key migration are separate work.
See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
and [API key migration](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
Obtain provider evidence of invalidation and re-verify frontend/API/worker.

## Recovery and account-owner cleanup

Retain the reviewed source commit and its keyless artifacts. Repair or redeploy
that release if retirement checks fail. Never roll back to the privileged old
API or re-enable revoked keys. New-service failures use a known-good new-service
release with valid replacement credentials, or a maintenance notice.

The Azure account owner must remove runtime secrets, stop/delete hosting
resources, identify independently scheduled jobs and slots, and confirm billing
cessation. GitHub control does not establish any of these. No databases, uploads
or production volumes are deleted by this release.

Completion must report links, both public tombstones, provider-confirmed old
access invalidation, obsolete workflow disablement, and account-owner shutdown
as distinct outcomes with evidence or precise blockers.
