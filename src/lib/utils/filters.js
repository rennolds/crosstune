// Lazy-load bad-words filter to handle ESM/CJS compatibility
let filter = null;

async function getFilter() {
  if (!filter) {
    const badWordsModule = await import('bad-words');
    const Filter = badWordsModule.default || badWordsModule.Filter || badWordsModule;
    filter = new Filter();
  }
  return filter;
}

// Precompiled regexes
const URL_REGEX = /(https?:\/\/|www\.)|([\w-]+\.(com|net|org|io|co|app|gg|dev|info|ai)(\b|\/))/i;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;
const CC_LIKE_REGEX = /\b(?:\d[ -]?){13,19}\b/;

export function normalizeText(input) {
  if (typeof input !== 'string') return '';
  try {
    // NFKC normalization collapses many unicode confusables
    input = input.normalize('NFKC');
  } catch {}
  // Collapse whitespace
  return input.trim().replace(/\s+/g, ' ');
}

export function containsUrl(text) {
  return URL_REGEX.test(text);
}

export function containsEmail(text) {
  return EMAIL_REGEX.test(text);
}

export function containsPhone(text) {
  return PHONE_REGEX.test(text);
}

export function containsSSN(text) {
  return SSN_REGEX.test(text);
}

export function containsCreditCardLike(text) {
  return CC_LIKE_REGEX.test(text);
}

export async function containsProfanity(text) {
  if (!text) return false;
  const f = await getFilter();
  return f.isProfane(text);
}

export function sanitizeClue(input) {
  return normalizeText(input);
}

export async function validateClue(input) {
  const value = sanitizeClue(input);
  const reasons = [];

  if (!value) {
    reasons.push('empty');
  }
  if (value.length > 150) {
    reasons.push('length');
  }
  if (containsUrl(value)) {
    reasons.push('url');
  }
  if (containsEmail(value) || containsPhone(value) || containsSSN(value) || containsCreditCardLike(value)) {
    reasons.push('pii');
  }
  if (await containsProfanity(value)) {
    reasons.push('profanity');
  }

  return {
    valid: reasons.length === 0,
    value,
    reasons
  };
}


// Additional sanitizers/validators for other fields
export function sanitizeTitle(input) {
  const value = normalizeText(input);
  return value.slice(0, 100);
}

export function sanitizeAuthor(input) {
  const value = normalizeText(input);
  // Allow reasonably long names/handles
  return value.slice(0, 80);
}

export function validateNotes(input) {
  const value = normalizeText(input);
  // Notes are optional
  if (!value) {
    return { valid: true, value: '' , reasons: [] };
  }
  const reasons = [];
  if (value.length > 300) {
    reasons.push('length');
  }

  // Basic malicious payload detection (SQLi / XSS hints)
  const MALICIOUS_PATTERNS = [
    /<\s*script\b/i,
    /javascript:/i,
    /on\w+\s*=\s*['"][^'"\n]*['"]/i,
    /(;\s*)?--\s*$/m,
    /\/\*/,
    /\b(union\s+all\s+select|union\s+select)\b/i,
    /\b(drop|truncate|alter)\s+table\b/i,
    /\b(insert\s+into|update\s+\w+\s+set|delete\s+from)\b/i,
    /\bxp_cmdshell\b/i,
    /\bwaitfor\b/i,
    /\bsleep\s*\(/i
  ];

  const hasMalicious = MALICIOUS_PATTERNS.some((re) => re.test(value));
  if (hasMalicious) {
    reasons.push('malicious');
  }

  // Strip control characters from value for safety in downstream sinks
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  return { valid: reasons.length === 0, value: cleaned, reasons };
}
