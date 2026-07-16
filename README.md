# kalender.digital MCP Server

[![CI](https://github.com/Movm/kalender-digital-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Movm/kalender-digital-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

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
MCP_API_KEY="ein-langes-zufälliges-secret" \
MCP_ALLOWED_ORIGINS="https://claude.ai,https://chatgpt.com" \
PORT=3000 \
pnpm start
```

Der MCP-Endpunkt liegt unter `http://localhost:3000/mcp`, der Health-Check unter `/health`. Requests ohne `Origin` (typische Server-zu-Server-MCP-Clients) sind erlaubt. Browser-Origins müssen explizit in `MCP_ALLOWED_ORIGINS` stehen. `MCP_API_KEY` wird als `Authorization: Bearer …` oder `X-API-Key` gesendet.

> Der HTTP-Modus verwendet einen gemeinsamen kalender.digital API-Key für alle Nutzer. Setze bei jeder Internet-Bereitstellung `MCP_API_KEY` und HTTPS. Origin-Filterung allein ist keine Authentifizierung.

## Docker / Coolify

```bash
docker build -t kalender-digital-mcp .
docker run --rm -p 3000:3000 \
  -e KALENDER_DIGITAL_API_KEY=your-api-key \
  -e MCP_API_KEY=your-private-mcp-key \
  kalender-digital-mcp
```

Coolify kann das enthaltene `Dockerfile` direkt bauen. Exponiere Port `3000`,
verwende `/health` als Healthcheck und speichere beide Schlüssel ausschließlich
als Runtime-Secrets.

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

Der vollständige Workflow und die Pull-Request-Checkliste stehen in
[CONTRIBUTING.md](CONTRIBUTING.md). Sicherheitslücken bitte privat über eine
[GitHub Security Advisory](https://github.com/Movm/kalender-digital-mcp/security/advisories/new)
melden.

## Lizenz

MIT
