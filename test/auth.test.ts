import { describe, expect, it } from "vitest";

import { requestIsAuthenticated } from "../src/auth.js";

describe("remote MCP authentication", () => {
  it("allows both documented key headers", () => {
    expect(requestIsAuthenticated("Bearer secret", undefined, "secret")).toBe(true);
    expect(requestIsAuthenticated(undefined, "secret", "secret")).toBe(true);
  });

  it("rejects missing and incorrect keys", () => {
    expect(requestIsAuthenticated(undefined, undefined, "secret")).toBe(false);
    expect(requestIsAuthenticated("Bearer wrong", undefined, "secret")).toBe(false);
  });

  it("keeps authentication optional for local and backwards-compatible deployments", () => {
    expect(requestIsAuthenticated(undefined, undefined, "")).toBe(true);
  });
});
