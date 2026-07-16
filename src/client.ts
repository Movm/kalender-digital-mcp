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

export class CalendarDigitalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(`kalender.digital API request failed with status ${status}`);
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

  deleteEvent(eventId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(`/event/${encodeURIComponent(eventId)}`, { method: "DELETE", signal });
  }

  createSubcalendar(name: string, signal?: AbortSignal): Promise<unknown> {
    return this.request("/subcalendar", this.jsonRequest("POST", { name }, signal));
  }

  updateSubcalendar(subcalendarId: string, name: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(
      `/subcalendar/${encodeURIComponent(subcalendarId)}`,
      this.jsonRequest("POST", { name }, signal),
    );
  }

  deleteSubcalendar(subcalendarId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(`/subcalendar/${encodeURIComponent(subcalendarId)}`, {
      method: "DELETE",
      signal,
    });
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
