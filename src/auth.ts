import { timingSafeEqual } from "node:crypto";

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function requestIsAuthenticated(
  authorization: string | undefined,
  apiKey: string | undefined,
  expected = process.env.MCP_API_KEY,
): boolean {
  if (!expected) return true;
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  return safeEqual(bearer, expected) || safeEqual(apiKey ?? "", expected);
}
