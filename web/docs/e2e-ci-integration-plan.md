# E2E Tests in CI — Integration Plan

## Overview

Each per-site workflow passes a spec file name and base URL env var name to `site-template.yml`, which runs a new `e2e-staging` job after `deploy-staging`. Playwright sends a Cloudflare bypass header on every request via `extraHTTPHeaders` so bot-protection rules don't block test traffic.

### Job flow after the change

```
build → deploy-staging → e2e-staging → deploy-live
```

Failing e2e tests block the live deploy.

---

## 1. `web/playwright.config.ts`

Two changes are required.

### a) Skip `webServer` when running against remote URLs

Wrap the `webServer` array so it is empty when `E2E_REMOTE=true` is set (CI runs against staging, not localhost):

```ts
webServer: process.env.E2E_REMOTE ? [] : [
  // existing dev server entries…
],
```

### b) Inject the Cloudflare bypass header on all requests

```ts
use: {
  trace: "on-first-retry",
  extraHTTPHeaders: process.env.E2E_CLOUDFLARE_SECRET
    ? { "x-cloudflare-e2e-secret": process.env.E2E_CLOUDFLARE_SECRET }
    : {},
},
```

The header value comes from the `E2E_CLOUDFLARE_SECRET` environment variable, which is populated from a GitHub Actions secret. Cloudflare is configured with a rule to exclude requests carrying this header from bot-protection checks.

---

## 2. `.github/workflows/site-template.yml`

### New optional inputs

```yaml
on:
  workflow_call:
    inputs:
      # …existing inputs…
      e2e_spec:
        required: false
        type: string
        default: ""
        # Spec filename without extension, e.g. "blackcattattoos-co-uk"
      e2e_base_url_env:
        required: false
        type: string
        default: ""
        # Env var name the spec reads for its base URL, e.g. "BLACKCATTATTOOS_BASE_URL"
```

### New optional secret

```yaml
    secrets:
      # …existing secrets…
      e2e_cloudflare_secret:
        required: false
```

### New job: `e2e-staging`

Runs after `deploy-staging`, only when `e2e_spec` is provided. Uses the same Node/pnpm setup as the `build` job.

```yaml
e2e-staging:
  runs-on: ubuntu-latest
  name: E2E Tests ${{ inputs.site }} (Staging)
  needs: deploy-staging
  if: >
    needs.deploy-staging.result == 'success' &&
    github.ref == 'refs/heads/main' &&
    inputs.e2e_spec != ''
  steps:
    - name: Checkout
      uses: actions/checkout@<pinned-sha>

    - name: Install Node.js
      uses: actions/setup-node@<pinned-sha>
      with:
        node-version: 24

    - name: Install pnpm
      uses: pnpm/action-setup@<pinned-sha>
      with:
        version: 10
        run_install: false

    - name: Get pnpm store directory
      id: pnpm-cache
      run: echo "pnpm_cache_dir=$(pnpm store path)" >> $GITHUB_OUTPUT

    - name: Restore pnpm cache
      uses: actions/cache@<pinned-sha>
      with:
        path: ${{ steps.pnpm-cache.outputs.pnpm_cache_dir }}
        key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          ${{ runner.os }}-pnpm-store-

    - name: Install dependencies
      working-directory: web
      run: pnpm install

    - name: Install Playwright browsers
      working-directory: web
      run: pnpm exec playwright install chromium --with-deps

    - name: Set staging base URL
      run: echo "${{ inputs.e2e_base_url_env }}=https://staging.${{ inputs.site }}" >> $GITHUB_ENV

    - name: Run E2E tests
      working-directory: web
      env:
        E2E_REMOTE: "true"
        E2E_CLOUDFLARE_SECRET: ${{ secrets.e2e_cloudflare_secret }}
      run: pnpm exec playwright test e2e-tests/${{ inputs.e2e_spec }}.spec.ts

    - name: Upload Playwright report
      if: always()
      uses: actions/upload-artifact@<pinned-sha>
      with:
        name: playwright-report-${{ inputs.site }}
        path: web/playwright-report/
        retention-days: 7
```

### Update `deploy-live` dependencies

Add `e2e-staging` to the `needs` of the `deploy-live` job so a test failure blocks production:

```yaml
deploy-live:
  needs: [deploy-staging, e2e-staging]
  if: >
    needs.deploy-staging.result == 'success' &&
    (needs.e2e-staging.result == 'success' || needs.e2e-staging.result == 'skipped') &&
    github.ref == 'refs/heads/main'
```

Using `skipped` in the condition ensures sites without a spec file configured still deploy to live.

---

## 3. Per-site workflow files

Add the new inputs and secret to each site's workflow that has a corresponding spec file.

### `web-blackcattattoos.yml`

```yaml
jobs:
  blackcattattoos:
    uses: ./.github/workflows/site-template.yml
    with:
      site: blackcattattoos.co.uk
      enable_cms: true
      e2e_spec: blackcattattoos-co-uk
      e2e_base_url_env: BLACKCATTATTOOS_BASE_URL
    secrets:
      server_host: ${{ secrets.VPS_HOST }}
      server_ssh_port: ${{ secrets.VPS_PORT }}
      server_key: ${{ secrets.VPS_CI_KEY }}
      directus_url: ${{ secrets.DIRECTUS_URL }}
      directus_build_secret: ${{ secrets.DIRECTUS_BUILD_SECRET }}
      e2e_cloudflare_secret: ${{ secrets.E2E_CLOUDFLARE_SECRET }}
```

### `web-jamesdurban.yml`

```yaml
jobs:
  jamesdurban:
    uses: ./.github/workflows/site-template.yml
    with:
      site: jamesdurban.com
      e2e_spec: jamesdurban-com
      e2e_base_url_env: JAMESDURBAN_BASE_URL
    secrets:
      server_host: ${{ secrets.VPS_HOST }}
      server_ssh_port: ${{ secrets.VPS_PORT }}
      server_key: ${{ secrets.VPS_CI_KEY }}
      e2e_cloudflare_secret: ${{ secrets.E2E_CLOUDFLARE_SECRET }}
```

Repeat this pattern for any other site that has a spec file.

---

## 4. GitHub Actions secret

Add a new repository (or organisation) secret:

| Secret name | Value |
|---|---|
| `E2E_CLOUDFLARE_SECRET` | A strong random string shared with the Cloudflare bypass rule |

The value must match exactly what the Cloudflare rule checks for in the `x-cloudflare-e2e-secret` request header.

---

## 5. Cloudflare rule (one-time setup)

In the Cloudflare dashboard, create a WAF custom rule or firewall rule for each site:

- **Field:** Request Header — `x-cloudflare-e2e-secret`
- **Operator:** equals
- **Value:** `<E2E_CLOUDFLARE_SECRET value>`
- **Action:** Skip / Allow (bypass bot fight mode and any rate-limiting rules)

This ensures Playwright traffic from GitHub Actions is not blocked while all other bot traffic remains protected.

---

## Spec file to env var mapping

| Spec file | `e2e_spec` input | `e2e_base_url_env` input |
|---|---|---|
| `blackcattattoos-co-uk.spec.ts` | `blackcattattoos-co-uk` | `BLACKCATTATTOOS_BASE_URL` |
| `jamesdurban-com.spec.ts` | `jamesdurban-com` | `JAMESDURBAN_BASE_URL` |
| `orchitect-net.spec.ts` | `orchitect-net` | `ORCHITECT_BASE_URL` |
| `stcatherinesgroup-com.spec.ts` | `stcatherinesgroup-com` | `STCATHERINESGROUP_BASE_URL` |
| `thecontourclinicrichmond-co-uk.spec.ts` | `thecontourclinicrichmond-co-uk` | `THECONTOURCLINICRICHMOND_BASE_URL` |

> **Note:** The env var names in the right column must match what each spec file reads. Check each spec for the exact variable name and update accordingly if they differ.