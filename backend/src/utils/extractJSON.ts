/**
 * Extracts the first valid JSON object or array from a string.
 * Handles cases where Gemini returns JSON wrapped in markdown, reasoning text,
 * or other surrounding content despite being asked for pure JSON.
 */
export function extractJSON(text: string): string {
  if (!text) return '';

  // 1. Strip markdown code fences first
  const stripped = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  // 2. Try the stripped text directly
  try {
    JSON.parse(stripped);
    return stripped;
  } catch {
    // continue
  }

  // 3. Find the first { or [ and extract the matching balanced block
  const startBrace = stripped.indexOf('{');
  const startBracket = stripped.indexOf('[');

  let start = -1;
  let closeChar = '';

  if (startBrace === -1 && startBracket === -1) return stripped;

  if (startBrace === -1) {
    start = startBracket;
    closeChar = ']';
  } else if (startBracket === -1) {
    start = startBrace;
    closeChar = '}';
  } else {
    start = Math.min(startBrace, startBracket);
    closeChar = start === startBrace ? '}' : ']';
  }

  const openChar = closeChar === '}' ? '{' : '[';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return stripped.slice(start, i + 1);
      }
    }
  }

  return stripped;
}
