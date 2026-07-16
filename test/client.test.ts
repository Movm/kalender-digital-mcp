import { describe, expect, it, vi } from "vitest";

import { CalendarDigitalApiError, CalendarDigitalClient } from "../src/client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CalendarDigitalClient", () => {
  it("lists events with the API key and encoded query parameters", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([{ id: 1 }]));
    const client = new CalendarDigitalClient("secret", {
      baseUrl: "https://example.test/public/",
      fetchImpl,
    });

    await client.listEvents({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      timeZone: "Europe/Berlin",
      query: "Team sync",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      "https://example.test/public/event?startDate=2026-01-01&endDate=2026-01-31&timeZone=Europe%2FBerlin&query=Team+sync",
    );
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({ "X-API-KEY": "secret" });
  });

  it("uses PUT and the documented JSON body when updating an event", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: "event-1" }));
    const client = new CalendarDigitalClient("secret", {
      baseUrl: "https://example.test/public",
      fetchImpl,
    });
    const event = {
      startDate: "2026-07-01 12:00:00",
      endDate: "2026-07-01 13:00:00",
      timeZone: "Europe/Berlin",
      title: "API Test",
      subCalendars: [42, "Team"],
      description: "",
      who: "",
      where: "Berlin",
      wholeDay: false,
      links: [],
    };

    await client.updateEvent("event/1", event);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://example.test/public/event/event%2F1");
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(JSON.stringify(event));
    expect(init?.headers).toMatchObject({
      "X-API-KEY": "secret",
      "Content-Type": "application/json",
    });
  });

  it("uses POST for subcalendar updates as documented", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new CalendarDigitalClient("secret", {
      baseUrl: "https://example.test/public",
      fetchImpl,
    });

    await client.updateSubcalendar("sub-1", "Renamed");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://example.test/public/subcalendar/sub-1");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Renamed" }));
  });

  it("returns a clear error when no API key is configured", async () => {
    const client = new CalendarDigitalClient("");
    await expect(client.deleteEvent("event-1")).rejects.toThrow(
      "KALENDER_DIGITAL_API_KEY is not configured",
    );
  });

  it("preserves API status and response body in errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403));
    const client = new CalendarDigitalClient("bad-key", {
      baseUrl: "https://example.test/public",
      fetchImpl,
    });

    const error = await client.deleteEvent("event-1").catch((caught) => caught);
    expect(error).toBeInstanceOf(CalendarDigitalApiError);
    expect(error).toMatchObject({ status: 403, responseBody: { message: "Forbidden" } });
  });
});
