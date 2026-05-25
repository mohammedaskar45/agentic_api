/**
 * SQL Validator – enforces read-only queries
 * Blocks: UPDATE, DELETE, DROP, ALTER, INSERT, TRUNCATE, CREATE, GRANT, REVOKE
 * Allows: SELECT, COUNT, aggregation queries
 */

const FORBIDDEN_KEYWORDS = [
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bINSERT\b/i,
  /\bTRUNCATE\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
  /\bCALL\b/i,
  /\bMERGE\b/i,
  /\bUPSERT\b/i,
  /\bINTO\s+\w/i,
  /\bSET\s+\w/i,
  /;.*;/i, // Multiple statements
];

const BLACKLISTED_COLUMNS = [
  'password',
  'refresh_token',
  'access_token',
  'otp',
  'secret_key',
  'hash',
  'salt',
  'private_key',
  'api_key',
  'token',
];

export interface SqlValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export function validateSql(sql: string): SqlValidationResult {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, error: 'SQL query must be a non-empty string' };
  }

  const trimmed = sql.trim();

  // Must start with SELECT or WITH (CTEs)
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Only SELECT queries are allowed. Mutations (INSERT/UPDATE/DELETE/DROP etc.) are forbidden.',
    };
  }

  // Check forbidden keywords
  for (const pattern of FORBIDDEN_KEYWORDS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: `Forbidden SQL keyword detected. Only read-only SELECT queries are permitted.`,
      };
    }
  }

  // Check for blacklisted column references
  for (const col of BLACKLISTED_COLUMNS) {
    const colPattern = new RegExp(`\\b${col}\\b`, 'i');
    if (colPattern.test(trimmed)) {
      return {
        valid: false,
        error: `Access to sensitive column '${col}' is not permitted.`,
      };
    }
  }

  // Prevent SQL injection via comments
  if (/(--)|(\/\*)|(#)/.test(trimmed)) {
    return {
      valid: false,
      error: 'SQL comments are not allowed in queries.',
    };
  }

  // Add LIMIT if not present to protect from row floods
  let sanitized = trimmed;
  if (!/\bLIMIT\b/i.test(sanitized)) {
    sanitized = sanitized.replace(/;?\s*$/, '') + ' LIMIT 100';
  }

  return { valid: true, sanitized };
}

export function sanitizeIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}
