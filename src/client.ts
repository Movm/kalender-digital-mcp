const DEFAULT_BASE_URL = "https://api.kalender.digital/public";

export type SubcalendarReference = number | string;

export interface CalendarEventInput {
  startDate: string;
  endDate: string;
  timeZone: string;
  title: string;
  subCalendars: SubcalendarReference[];
  description: string;
  who: string;
  where: string;
  wholeDay: boolean;
  links: string[];
}

export interface ListEventsInput {
  startDate: string;
  endDate: string;
  timeZone: string;
  query?: string;
}

/** Hints for the failure codes the API sends as `{ success: false, msg }`. */
const FAILURE_HINTS: Record<string, string> = {
  FAILURE_INVALID_API_KEY: "the API key is invalid or the calendar has no Premium API access",
  FAILURE_API_KEY_MISSING: "no API key was sent",
};

function failureCode(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const msg = (body as { msg?: unknown }).msg;
  return typeof msg === "string" && /^[A-Z0-9_]{1,80}$/.test(msg) ? msg : null;
}

export class CalendarDigitalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    const code = failureCode(responseBody);
    const hint = code ? FAILURE_HINTS[code] : undefined;
    const detail = code ? `: ${code}${hint ? ` (${hint})` : ""}` : "";
    super(`kalender.digital API request failed with status ${status}${detail}`);
    this.name = "CalendarDigitalApiError";
  }
}

export class CalendarDigitalClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey = process.env.KALENDER_DIGITAL_API_KEY,
    options: {
      baseUrl?: string;
      fetchImpl?: typeof fetch;
    } = {},
  ) {
    this.baseUrl = (options.baseUrl ?? process.env.KALENDER_DIGITAL_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  listEvents(input: ListEventsInput, signal?: AbortSignal): Promise<unknown> {
    const params = new URLSearchParams({
      startDate: input.startDate,
      endDate: input.endDate,
      timeZone: input.timeZone,
      query: input.query ?? "",
    });

    return this.request(`/event?${params.toString()}`, { method: "GET", signal });
  }

  getEvent(eventId: string, timeZone: string, signal?: AbortSignal): Promise<unknown> {
    const params = new URLSearchParams({ timeZone });
    return this.request(`/event/${encodeURIComponent(eventId)}?${params.toString()}`, {
      method: "GET",
      signal,
    });
  }

  createEvent(event: CalendarEventInput, signal?: AbortSignal): Promise<unknown> {
    return this.request("/event", this.jsonRequest("POST", event, signal));
  }

  updateEvent(eventId: string, event: CalendarEventInput, signal?: AbortSignal): Promise<unknown> {
    return this.request(`/event/${encodeURIComponent(eventId)}`, this.jsonRequest("PUT", event, signal));
  }

  private jsonRequest(method: "POST" | "PUT", body: unknown, signal?: AbortSignal): RequestInit {
    return {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    };
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error("KALENDER_DIGITAL_API_KEY is not configured");
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "X-API-KEY": this.apiKey,
        Accept: "application/json",
        ...init.headers,
      },
    });

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      throw new CalendarDigitalApiError(response.status, body);
    }

    return body;
  }
}
