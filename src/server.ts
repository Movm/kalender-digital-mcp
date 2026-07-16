import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CalendarDigitalClient, type CalendarEventInput } from "./client.js";

const API_DOCS_URL = "https://kalender.digital/c/documentation/api?lang=de";
const dateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  .describe("Local date and time formatted as YYYY-MM-DD HH:mm:ss");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date formatted as YYYY-MM-DD");
const timeZone = z.string().min(1).default("Europe/Berlin").describe("IANA time zone name");
const eventId = z.string().min(1).describe("kalender.digital event ID");
const subcalendarId = z.string().min(1).describe("kalender.digital subcalendar ID");

const eventFields = {
  startDate: dateTime,
  endDate: dateTime,
  timeZone,
  title: z.string().min(1).describe("Event title"),
  subCalendars: z
    .array(z.union([z.number().int().positive(), z.string().min(1)]))
    .min(1)
    .describe("Subcalendar IDs or names"),
  description: z.string().default("").describe("Event description"),
  who: z.string().default("").describe("People or organizer associated with the event"),
  where: z.string().default("").describe("Event location"),
  wholeDay: z.boolean().default(false).describe("Whether this is an all-day event"),
  links: z.array(z.string()).default([]).describe("Links associated with the event"),
};

function toolResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

async function safeCall(operation: () => Promise<unknown>) {
  try {
    return toolResult(await operation());
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : "Unknown kalender.digital API error",
        },
      ],
    };
  }
}

export function createMcpServer(client = new CalendarDigitalClient()): McpServer {
  const server = new McpServer(
    { name: "kalender-digital-mcp", version: "0.1.0" },
    {
      instructions:
        "Use list_events to find event IDs. Dates without times use YYYY-MM-DD; event timestamps use YYYY-MM-DD HH:mm:ss.",
    },
  );

  server.registerTool(
    "list_events",
    {
      title: "List calendar events",
      description: `List kalender.digital events within an inclusive date range, optionally filtered by a search query. API documentation: ${API_DOCS_URL}`,
      inputSchema: {
        startDate: date.describe("First date to include, formatted as YYYY-MM-DD"),
        endDate: date.describe("Last date to include, formatted as YYYY-MM-DD"),
        timeZone,
        query: z.string().default("").describe("Optional text filter; use an empty string for all events"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (input, extra) => safeCall(() => client.listEvents(input, extra.signal)),
  );

  server.registerTool(
    "get_event",
    {
      title: "Get calendar event",
      description: `Fetch one kalender.digital event by its event ID. Use list_events if the ID is unknown. API documentation: ${API_DOCS_URL}`,
      inputSchema: { eventId, timeZone },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ eventId: id, timeZone: zone }, extra) => safeCall(() => client.getEvent(id, zone, extra.signal)),
  );

  server.registerTool(
    "create_event",
    {
      title: "Create calendar event",
      description: `Create an event in one or more kalender.digital subcalendars. API documentation: ${API_DOCS_URL}`,
      inputSchema: eventFields,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input, extra) => safeCall(() => client.createEvent(input as CalendarEventInput, extra.signal)),
  );

  server.registerTool(
    "update_event",
    {
      title: "Update calendar event",
      description: `Replace the editable fields of an existing kalender.digital event. All event fields are required. API documentation: ${API_DOCS_URL}`,
      inputSchema: { eventId, ...eventFields },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ eventId: id, ...event }, extra) =>
      safeCall(() => client.updateEvent(id, event as CalendarEventInput, extra.signal)),
  );

  server.registerTool(
    "delete_event",
    {
      title: "Delete calendar event",
      description: `Permanently delete a kalender.digital event by ID. API documentation: ${API_DOCS_URL}`,
      inputSchema: { eventId },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ eventId: id }, extra) => safeCall(() => client.deleteEvent(id, extra.signal)),
  );

  server.registerTool(
    "create_subcalendar",
    {
      title: "Create subcalendar",
      description: `Create a kalender.digital subcalendar. API documentation: ${API_DOCS_URL}`,
      inputSchema: { name: z.string().min(1).describe("Name of the new subcalendar") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ name }, extra) => safeCall(() => client.createSubcalendar(name, extra.signal)),
  );

  server.registerTool(
    "update_subcalendar",
    {
      title: "Update subcalendar",
      description: `Rename an existing kalender.digital subcalendar. API documentation: ${API_DOCS_URL}`,
      inputSchema: {
        subcalendarId,
        name: z.string().min(1).describe("New subcalendar name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ subcalendarId: id, name }, extra) =>
      safeCall(() => client.updateSubcalendar(id, name, extra.signal)),
  );

  server.registerTool(
    "delete_subcalendar",
    {
      title: "Delete subcalendar",
      description: `Permanently delete a kalender.digital subcalendar. API documentation: ${API_DOCS_URL}`,
      inputSchema: { subcalendarId },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ subcalendarId: id }, extra) => safeCall(() => client.deleteSubcalendar(id, extra.signal)),
  );

  return server;
}
