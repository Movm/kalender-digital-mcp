# kalender.digital MCP Server

Ein kleiner MCP-Server für die offizielle [kalender.digital API](https://kalender.digital/c/documentation/api?lang=de). Er stellt Termine und Unterkalender als klar getrennte MCP-Tools bereit.

## Funktionen

- Termine auflisten und einzeln abrufen
- Termine erstellen, vollständig ändern und löschen
- Unterkalender erstellen, umbenennen und löschen
- Lokal über `stdio` oder als Streamable-HTTP-Server nutzbar
- API-Key ausschließlich über eine Umgebungsvariable

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

> Der HTTP-Modus verwendet einen gemeinsamen kalender.digital API-Key für alle Nutzer. Für einen öffentlichen Mehrnutzer-Dienst sollte davor eine eigene Authentifizierung ergänzt werden.

## Tools

| Tool | Wirkung |
| --- | --- |
| `list_events` | Termine in einem Zeitraum abrufen |
| `get_event` | Einzelnen Termin abrufen |
| `create_event` | Termin erstellen |
| `update_event` | Termin vollständig ändern |
| `delete_event` | Termin löschen |
| `create_subcalendar` | Unterkalender erstellen |
| `update_subcalendar` | Unterkalender umbenennen |
| `delete_subcalendar` | Unterkalender löschen |

Webhooks werden in kalender.digital selbst eingerichtet und sind deshalb kein MCP-Tool.

## Entwicklung

```bash
pnpm test
pnpm check
pnpm build
```

## Lizenz

MIT
