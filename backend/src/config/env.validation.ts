/**
 * Fail fast on a misconfigured deployment instead of silently falling back to
 * development defaults in production.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProduction = config.NODE_ENV === 'production';
  const required = isProduction
    ? ['DATABASE_URL', 'CORE_HUB_URL', 'CORE_HUB_WEB_URL', 'CORE_HUB_ISSUER', 'CORE_HUB_AUDIENCE', 'SUBSYSTEM_ID']
    : ['DATABASE_URL'];

  const missing = required.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const jwksUrl = String(config.CORE_HUB_JWKS_URL ?? '');
  if (isProduction && jwksUrl.startsWith('http://')) {
    throw new Error('CORE_HUB_JWKS_URL must use HTTPS in production (spec §41.14)');
  }

  const aiApiKey = String(config.FAQ_AI_API_KEY ?? '').trim();
  const aiResponsesUrl = String(config.FAQ_AI_RESPONSES_URL ?? '').trim();
  if (aiApiKey && !aiResponsesUrl) {
    throw new Error('FAQ_AI_RESPONSES_URL is required when FAQ_AI_API_KEY is configured');
  }
  if (aiResponsesUrl) {
    let parsed: URL;
    try {
      parsed = new URL(aiResponsesUrl);
    } catch {
      throw new Error('FAQ_AI_RESPONSES_URL must be a valid absolute URL');
    }
    if (isProduction && parsed.protocol !== 'https:') {
      throw new Error('FAQ_AI_RESPONSES_URL must use HTTPS in production');
    }
  }

  return config;
}
