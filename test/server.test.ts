import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { createMcpServer } from "../src/server.js";

const openClients: Client[] = [];
const openServers: ReturnType<typeof createMcpServer>[] = [];

afterEach(async () => {
  await Promise.all(openClients.splice(0).map((client) => client.close()));
  await Promise.all(openServers.splice(0).map((server) => server.close()));
});

describe("kalender.digital MCP server", () => {
  it("completes the MCP handshake and exposes the documented tool surface", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer();
    const client = new Client({ name: "test-client", version: "1.0.0" });
    openServers.push(server);
    openClients.push(client);

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      "list_events",
      "get_event",
      "create_event",
      "update_event",
      "delete_event",
      "create_subcalendar",
      "update_subcalendar",
      "delete_subcalendar",
    ]);
    expect(tools.every((tool) => Boolean(tool.title))).toBe(true);
    expect(tools.every((tool) => tool.annotations?.openWorldHint === true)).toBe(true);
    expect(tools.find((tool) => tool.name === "list_events")?.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
    });
    expect(tools.find((tool) => tool.name === "delete_event")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: true,
    });
  });

  it("returns a recoverable MCP tool error when the API key is missing", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer();
    const client = new Client({ name: "test-client", version: "1.0.0" });
    openServers.push(server);
    openClients.push(client);

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_event",
      arguments: { eventId: "event-1", timeZone: "Europe/Berlin" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "KALENDER_DIGITAL_API_KEY is not configured" },
    ]);
  });
});
