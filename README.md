# kalender.digital MCP Server

Ein kleiner MCP-Server für die offizielle [kalender.digital API](https://kalender.digital/c/documentation/api?lang=de). Er stellt Termine und Unterkalender als klar getrennte MCP-Tools bereit.

## Funktionen

- Termine auflisten und einzeln abrufen
- Termine erstellen und vollständig ändern
- **Kein Löschen:** Termine und Unterkalender lassen sich über diesen Server weder löschen noch verwalten
- Lokal über `stdio` oder als Streamable-HTTP-Server nutzbar
- Im HTTP-Modus bringt jede Anfrage ihren eigenen API-Key mit; der Server speichert keinen

Die kalender.digital API ist laut Anbieter Teil der Premium-Version.

## Voraussetzungen

- Node.js 20 oder neuer
- pnpm
- Ein kalender.digital API-Key aus **Admin-Einstellungen → API**

## Installation

```bash
pnpm install
pnpm build
```

## Lokal starten (stdio)

```bash
KALENDER_DIGITAL_API_KEY="dein-api-key" pnpm start
```

Beispiel für eine MCP-Client-Konfiguration:

```json
{
  "mcpServers": {
    "kalender-digital": {
      "command": "node",
      "args": ["/ABSOLUTER/PFAD/kalender-digital-mcp/dist/index.js"],
      "env": {
        "KALENDER_DIGITAL_API_KEY": "dein-api-key"
      }
    }
  }
}
```

## HTTP-Modus

```bash
KALENDER_DIGITAL_API_KEY="dein-api-key" \
MCP_TRANSPORT=http \
MCP_ALLOWED_ORIGINS="https://claude.ai,https://chatgpt.com" \
PORT=3000 \
pnpm start
```

Der MCP-Endpunkt liegt unter `http://localhost:3000/mcp`, der Health-Check unter `/health`. Requests ohne `Origin` (typische Server-zu-Server-MCP-Clients) sind erlaubt. Browser-Origins müssen explizit in `MCP_ALLOWED_ORIGINS` stehen.

### Ein Key pro Anfrage

Im HTTP-Modus liest der Server den kalender.digital API-Key aus jeder Anfrage:

- Header `X-API-KEY: <key>` oder
- Header `Authorization: Bearer <key>`

Fehlt beides, antwortet `/mcp` mit `401`. `KALENDER_DIGITAL_API_KEY` ist im HTTP-Modus nur ein Rückfall für den Einzelbetrieb; für einen Dienst, den mehrere Personen mit ihren eigenen Kalendern nutzen, bleibt die Variable leer. Der Server speichert und protokolliert keine Keys.

### Docker

```bash
docker build -t kalender-digital-mcp .
docker run -p 3000:3000 kalender-digital-mcp
```

Das Image startet im HTTP-Modus und hat einen Health-Check auf `/health`.

## Tools

| Tool | Wirkung |
| --- | --- |
| `list_events` | Termine in einem Zeitraum abrufen |
| `get_event` | Einzelnen Termin abrufen |
| `create_event` | Termin erstellen |
| `update_event` | Termin vollständig ändern |

Webhooks werden in kalender.digital selbst eingerichtet und sind deshalb kein MCP-Tool.

## Entwicklung

```bash
pnpm test
pnpm check
pnpm build
```

## Lizenz

MIT
