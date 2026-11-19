#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createHttpApp } from "./http.js";
import { createMcpServer } from "./server.js";

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

function startHttp(): void {
  const app = createHttpApp({
    fallbackApiKey: process.env.KALENDER_DIGITAL_API_KEY,
    allowedOrigins: (process.env.MCP_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.error(`kalender-digital-mcp listening on http://0.0.0.0:${port}/mcp`);
  });
}

if (process.env.MCP_TRANSPORT === "http") {
  startHttp();
} else {
  await startStdio();
}
