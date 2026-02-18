// Security utility: redact API keys, tokens, and PII from display strings
// IMPORTANT: This is display-only — never mutates source data

const PATTERNS: [RegExp, string][] = [
  // AWS access keys (AKIA...)
  [/\bAKIA[A-Z0-9]{12,}\b/g, (m: string) => m.slice(0, 4) + '****'],
  // API keys with common prefixes
  [/\b(sk-|xai-|key-|api-|tok-|pat-|ghp_|gho_|ghu_|ghs_|ghr_|glpat-|pypi-|npm_)[A-Za-z0-9_-]{8,}\b/g,
    (m: string) => m.slice(0, 6) + '****'],
  // Bearer tokens
  [/Bearer\s+[A-Za-z0-9._~+/=-]{20,}/g, 'Bearer ****'],
  // JWT tokens (three base64 segments)
  [/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, 'eyJ****'],
  // Email addresses
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    (m: string) => m[0] + '****@' + m.split('@')[1]],
  // Generic hex secrets (32+ chars of hex)
  [/\b[0-9a-f]{32,}\b/gi, (m: string) => m.slice(0, 6) + '****'],
  // Environment variable values that look like secrets
  [/(password|secret|token|apikey|api_key)\s*[=:]\s*\S{8,}/gi,
    (m: string) => m.split(/[=:]/)[0] + '=****'],
]

/**
 * Redact sensitive values from a string for display purposes.
 * Returns a new string — never mutates the input.
 */
export function obfuscateString(input: string): string {
  let result = input
  for (const [pattern, replacement] of PATTERNS) {
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement)
    } else {
      result = result.replace(pattern, replacement as (match: string) => string)
    }
  }
  return result
}

/**
 * Deep-obfuscate an object's string values for display.
 * Returns a new object — never mutates the input.
 */
export function obfuscatePayload(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = obfuscateString(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = obfuscatePayload(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map(v =>
        typeof v === 'string' ? obfuscateString(v) :
        (v && typeof v === 'object' ? obfuscatePayload(v) : v)
      )
    } else {
      result[key] = value
    }
  }
  return result
}
