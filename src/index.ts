#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { requestIsAuthenticated } from "./auth.js";
import { createMcpServer } from "./server.js";

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

function allowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowed = (process.env.MCP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowed.includes(origin);
}

async function startHttp(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "kalender-digital-mcp",
      authentication: process.env.MCP_API_KEY ? "bearer-token" : "disabled",
    });
  });

  app.post("/mcp", async (request, response) => {
    if (!requestIsAuthenticated(request.get("authorization"), request.get("x-api-key"))) {
      response.set("WWW-Authenticate", "Bearer").status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowedOrigin(request.get("origin"))) {
      response.status(403).json({ error: "Origin not allowed" });
      return;
    }

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      if (!response.headersSent) {
        response.status(500).json({
          error: error instanceof Error ? error.message : "MCP request failed",
        });
      }
    }
  });

  app.get("/mcp", (_request, response) => response.status(405).set("Allow", "POST").end());
  app.delete("/mcp", (_request, response) => response.status(405).set("Allow", "POST").end());

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  if (!process.env.MCP_API_KEY) {
    console.error("SECURITY WARNING: MCP_API_KEY is unset; /mcp is publicly accessible.");
  }
  await new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(port, "0.0.0.0", () => {
      console.error(`kalender-digital-mcp listening on http://0.0.0.0:${port}/mcp`);
    });
    httpServer.once("error", reject);
    const shutdown = () => httpServer.close(() => resolve());
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  });
}

if (process.env.MCP_TRANSPORT === "http") {
  await startHttp();
} else {
  await startStdio();
}
