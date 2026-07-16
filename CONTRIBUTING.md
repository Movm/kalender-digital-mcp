# Mitwirken

## Entwicklungsumgebung

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm check
pnpm test
pnpm build
```

Verwende für lokale Tests einen eigenen kalender.digital-Testkalender. Automatische
Tests müssen API-Aufrufe mocken und dürfen keine echten Termine verändern.

## Pull Requests

- Für Verhaltensänderungen Tests ergänzen.
- Tool-Schemas eng halten und Annotationen für schreibende/destruktive Tools prüfen.
- API-Key, MCP-Key und `.env` niemals committen.
- `pnpm check`, `pnpm test`, `pnpm build` und `docker build .` ausführen.
- Änderungen an API-Verhalten in README und `.env.example` dokumentieren.

Sicherheitslücken bitte als private GitHub Security Advisory melden.
