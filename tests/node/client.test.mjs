import assert from "node:assert/strict";
import test from "node:test";
import {
  createFakturoidClient,
  FakturoidApiError,
} from "../../dist/index.js";

// Exercise the compiled public entry point under Node.js.
function fixture(transport) {
  let tokens = null;
  const client = createFakturoidClient({
    config: {
      clientId: "test-client",
      clientSecret: "test-secret",
      redirectUri: "",
      userAgent: "FuxaTests (test@example.invalid)",
      environment: "test",
      fetch: transport,
    },
    tokenStore: {
      async getTokens() { return tokens; },
      async saveTokens(_tenant, next) { tokens = next; },
      async deleteTokens() { tokens = null; },
    },
  });
  return { client, expire() { if (tokens) tokens.expiresAt = 0; } };
}

const tokenResponse = () => Response.json({ access_token: "test-access", expires_in: 7200 });

test("installed SDK loads in Node ESM and obtains explicit-account Client Credentials", async () => {
  const calls = [];
  const { client } = fixture(async (url, init) => {
    calls.push({ url: String(url), init });
    return String(url).endsWith("/oauth/token") ? tokenResponse() : Response.json([]);
  });
  const resources = await client.connectWithClientCredentials("local-account", "fuxa-test");
  await resources.invoices.list({ custom_id: "request-123", page: 2 });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://app.fakturoid.cz/api/v3/oauth/token");
  assert.equal(calls[0].init?.body, "grant_type=client_credentials");
  assert.equal(new Headers(calls[0].init?.headers).get("User-Agent"), "FuxaTests (test@example.invalid)");
  assert.equal(calls[1].url, "https://app.fakturoid.cz/api/v3/accounts/fuxa-test/invoices.json?page=2&custom_id=request-123");
  assert.equal(new Headers(calls[1].init?.headers).get("Authorization"), "Bearer test-access");
});

test("SDK never retries invoice POST after an ambiguous server failure or rate limit", async () => {
  for (const status of [429, 500, 502, 503, 504]) {
    let writes = 0;
    const { client } = fixture(async (url) => {
      if (String(url).endsWith("/oauth/token")) return tokenResponse();
      writes++;
      return Response.json({ error: "unavailable" }, { status });
    });
    const resources = await client.connectWithClientCredentials("tenant", "fuxa-test");
    await assert.rejects(resources.invoices.create({ subject_id: 1, lines: [{ name: "Repair", unit_price: "100.00", quantity: 1 }] }), (error) => error instanceof FakturoidApiError && error.status === status);
    assert.equal(writes, 1, `POST must execute once for HTTP ${status}`);
  }
});

test("SDK does not retry invoice POST after transport loses its response", async () => {
  let writes = 0;
  const { client } = fixture(async (url) => {
    if (String(url).endsWith("/oauth/token")) return tokenResponse();
    writes++;
    throw new TypeError("Connection lost after server accepted invoice");
  });
  const resources = await client.connectWithClientCredentials("tenant", "fuxa-test");
  await assert.rejects(resources.invoices.create({ subject_id: 1, lines: [] }), /Connection lost/);
  assert.equal(writes, 1);
});

test("Client Credentials renewal is coalesced and retains the explicit account slug", async () => {
  let tokens = 0;
  const { client, expire } = fixture(async (url) => {
    if (String(url).endsWith("/oauth/token")) { tokens++; return tokenResponse(); }
    assert.match(String(url), /accounts\/fuxa-test\/invoices/);
    return Response.json([]);
  });
  const resources = await client.connectWithClientCredentials("tenant", "fuxa-test");
  expire();
  await Promise.all([resources.invoices.list(), resources.invoices.list()]);
  assert.equal(tokens, 2);
});

test("failed token renewal propagates once without an unhandled finally rejection", async () => {
  let tokens = 0;
  const { client, expire } = fixture(async () => {
    tokens++;
    return tokens === 1 ? tokenResponse() : Response.json({ error: "invalid_client" }, { status: 401 });
  });
  const resources = await client.connectWithClientCredentials("tenant", "fuxa-test");
  expire();
  await assert.rejects(resources.invoices.list(), /invalid_client/);
  await new Promise((resolve) => setImmediate(resolve));
});
