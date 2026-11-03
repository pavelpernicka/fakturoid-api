# Fakturoid API for TypeScript

A backend client for [Fakturoid API v3](https://www.fakturoid.cz/api/v3), targeting Node.js 24 and newer. This is a fork of [thinkhome-org/fakturoid-typescript-api](https://github.com/thinkhome-org/fakturoid-typescript-api), distributed under the original Apache-2.0 license.

The fork adds Node.js ESM-compatible imports, injectable HTTP transport, and safe write semantics: POST, PATCH, PUT and DELETE requests are never automatically retried. A failed write can have succeeded remotely; reconcile by your own reference before deciding what to do next. Fakturoid's `custom_id` filter is useful for recovery but is not a server-side idempotency guarantee.

## Installation

Use a versioned release archive or pin a Git commit. Git installations run `prepare` to build the TypeScript sources; Bun is needed only for development tests.

```sh
npm install https://github.com/pavelpernicka/fakturoid-api/releases/download/v0.1.4/pavelpernicka-fakturoid-api-0.1.4.tgz
```

## Single-account integration

```ts
import {
  createFakturoidClient,
  type FakturoidTokens,
} from '@pavelpernicka/fakturoid-api';

let tokens: FakturoidTokens | null = null;
const client = createFakturoidClient({
  config: {
    clientId: process.env.FAKTUROID_CLIENT_ID!,
    clientSecret: process.env.FAKTUROID_CLIENT_SECRET!,
    userAgent: 'MyApplication (technical-contact@example.com)',
    redirectUri: '', // Only used by Authorization Code flow.
    environment: 'production',
  },
  tokenStore: {
    async getTokens() { return tokens; },
    async saveTokens(_tenantId, value) { tokens = value; },
    async deleteTokens() { tokens = null; },
  },
});
const account = await client.connectWithClientCredentials('local-account', 'your-account-slug');
const invoices = await account.invoices.list({ page: 1 });
```

Supply the account slug explicitly when a login has multiple accounts. Access tokens are renewed before expiry. Keep credentials and tokens on the server. A production token store must isolate tenants; the example is for one account in one process.

Authorization Code flow remains available via `getAuthorizationUrl`, `handleOAuthCallback` and `forTenant`. The application must generate and validate OAuth `state` and bind the callback to the correct user/tenant before invoking the SDK.

`environment: 'test'` is metadata, **not a sandbox switch**. Both environments use the real Fakturoid API. Use a separate Fakturoid test account and credentials for live tests.

## Cancellation and transport

Inject `config.fetch` to apply a job's cancellation signal to both OAuth and resource requests. Do not change global `fetch` in application code.

```ts
const transport: typeof fetch = (input, init) => fetch(input, {
  ...init,
  redirect: 'error',
  signal: AbortSignal.any([
    jobSignal,
    ...(init?.signal ? [init.signal] : []),
  ]),
});
// Pass transport as config.fetch when constructing the client for this job.
```

GET requests retry selected transient HTTP errors. Write failures propagate without retry. Decimal money values are preserved as returned by the API; applications must avoid floating-point arithmetic for settlement checks. Responses are TypeScript-typed, not runtime-schema validated.

Available resources include invoices, invoice payments, contacts, account/bank data, events, webhooks, expenses, recurring documents and inventory. See the exported types and [official API documentation](https://www.fakturoid.cz/api/v3).

## Development

Node.js 24 and Bun 1.3.5 are used in CI.

```sh
bun install --frozen-lockfile
bun run typecheck
bun test src
npm run test:node
npm pack
```

The upstream unit suite runs in Bun; additional regression tests run against the compiled package in Node.js. CI also installs the packed archive in a clean directory and checks its public ESM entry point. Live integration tests are opt-in (`bun run test:integration`) and require a dedicated test account; do not run them against production.

On a pushed version tag (`vX.Y.Z`), the release workflow verifies the tag against `package.json`, runs checks, builds and attaches the npm archive. It does not publish to the upstream package or require an npm token.
