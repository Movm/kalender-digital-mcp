import { type AddressInfo } from "node:net";
import { type Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpApp, requestApiKey } from "../src/http.js";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((resolve) => s.close(resolve))));
});

async function start(app: ReturnType<typeof createHttpApp>): Promise<string> {
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const listTools = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
const mcpHeaders = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };

describe("requestApiKey", () => {
  it("prefers X-API-KEY, then a bearer token, then the fallback", () => {
    expect(requestApiKey({ "x-api-key": " k1 " }, "env")).toBe("k1");
    expect(requestApiKey({ authorization: "Bearer k2" }, "env")).toBe("k2");
    expect(requestApiKey({}, "env")).toBe("env");
    expect(requestApiKey({}, undefined)).toBeNull();
    expect(requestApiKey({ authorization: "Basic abc" }, undefined)).toBeNull();
  });
});

describe("HTTP transport", () => {
  it("rejects a request without any API key with 401", async () => {
    const base = await start(createHttpApp({ fallbackApiKey: undefined }));
    const res = await fetch(`${base}/mcp`, { method: "POST", headers: mcpHeaders, body: JSON.stringify(listTools) });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Missing kalender.digital API key (X-API-KEY header)" });
  });

  it("uses the per-request key for kalender.digital calls", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("[]", { status: 200 }));
    const base = await start(createHttpApp({ fallbackApiKey: undefined, fetchImpl }));
    const call = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "list_events", arguments: { startDate: "2026-12-01", endDate: "2026-12-07" } },
    };
    const res = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...mcpHeaders, "X-API-KEY": "person-key" },
      body: JSON.stringify(call),
    });
    expect(res.status).toBe(200);
    await res.text();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][1]?.headers).toMatchObject({ "X-API-KEY": "person-key" });
  });

  it("answers the health check without a key", async () => {
    const base = await start(createHttpApp({ fallbackApiKey: undefined }));
    const res = await fetch(`${base}/health`);
    expect(await res.json()).toEqual({ status: "ok", service: "kalender-digital-mcp" });
  });
});
