# Sicherheit

Sicherheitslücken bitte privat über eine
[GitHub Security Advisory](https://github.com/Movm/kalender-digital-mcp/security/advisories/new)
melden und keine Secrets in öffentliche Issues kopieren.

Für Internet-Deployments:

- HTTPS verwenden und `MCP_API_KEY` setzen.
- `KALENDER_DIGITAL_API_KEY` und `MCP_API_KEY` nur als Runtime-Secrets speichern.
- `MCP_ALLOWED_ORIGINS` nur als zusätzliche Browser-Schutzschicht betrachten.
- Schlüssel nach einer Offenlegung sofort rotieren.
- Für Entwicklung einen separaten Testkalender verwenden.
