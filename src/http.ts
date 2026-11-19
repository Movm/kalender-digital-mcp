import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Express } from "express";

import { CalendarDigitalClient } from "./client.js";
import { createMcpServer } from "./server.js";

type Headers = Record<string, string | string[] | undefined>;

function header(headers: Headers, name: string): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The kalender.digital API key for one request. Each caller brings its own key
 * (`X-API-KEY`, or `Authorization: Bearer <key>`); the server stores none.
 * `fallback` (the `KALENDER_DIGITAL_API_KEY` env) only serves a single-user
 * deployment and is never needed when every caller sends a key.
 */
export function requestApiKey(headers: Headers, fallback: string | undefined): string | null {
  const direct = header(headers, "x-api-key")?.trim();
  if (direct) return direct;
  const bearer = header(headers, "authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) return bearer;
  return fallback?.trim() || null;
}

function allowedOrigin(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) return true;
  return allowed.includes(origin);
}

export function createHttpApp(options: {
  fallbackApiKey: string | undefined;
  allowedOrigins?: string[];
  fetchImpl?: typeof fetch;
}): Express {
  const allowed = options.allowedOrigins ?? [];
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "kalender-digital-mcp" });
  });

  app.post("/mcp", async (request, response) => {
    if (!allowedOrigin(request.get("origin"), allowed)) {
      response.status(403).json({ error: "Origin not allowed" });
      return;
    }

    const apiKey = requestApiKey(request.headers, options.fallbackApiKey);
    if (!apiKey) {
      response.status(401).json({ error: "Missing kalender.digital API key (X-API-KEY header)" });
      return;
    }

    const client = new CalendarDigitalClient(
      apiKey,
      options.fetchImpl ? { fetchImpl: options.fetchImpl } : {},
    );
    const server = createMcpServer(client);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch {
      if (!response.headersSent) {
        response.status(500).json({ error: "MCP request failed" });
      }
    }
  });

  app.get("/mcp", (_request, response) => response.status(405).set("Allow", "POST").end());
  app.delete("/mcp", (_request, response) => response.status(405).set("Allow", "POST").end());

  return app;
}
