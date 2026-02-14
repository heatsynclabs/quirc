const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://quirc.chat'
const MAX_RESPONSE_SIZE = 1024 * 1024 // 1MB
const MAX_REDIRECTS = 3

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
  /^localhost$/i,
]

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function isPrivateHost(hostname) {
  return PRIVATE_IP_PATTERNS.some(p => p.test(hostname))
}

function validateUrl(urlStr) {
  let parsed
  try {
    parsed = new URL(urlStr)
  } catch {
    return { ok: false, reason: 'Invalid URL' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http/https URLs are allowed' }
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'URLs with credentials are not allowed' }
  }

  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, reason: 'Private/internal URLs are not allowed' }
  }

  return { ok: true, parsed }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders() }
  }

  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Missing url param' }
  }

  const validation = validateUrl(targetUrl)
  if (!validation.ok) {
    return { statusCode: 400, headers: corsHeaders(), body: validation.reason }
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'QUIRC-Unfurl/1.0' },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })

    // Check final URL after redirects for SSRF
    if (res.url) {
      const finalValidation = validateUrl(res.url)
      if (!finalValidation.ok) {
        return { statusCode: 400, headers: corsHeaders(), body: 'Redirect to private URL blocked' }
      }
    }

    // Enforce size limit
    const contentLength = parseInt(res.headers.get('content-length') || '0')
    if (contentLength > MAX_RESPONSE_SIZE) {
      return { statusCode: 413, headers: corsHeaders(), body: 'Response too large' }
    }

    const html = await res.text()
    if (html.length > MAX_RESPONSE_SIZE) {
      return { statusCode: 413, headers: corsHeaders(), body: 'Response too large' }
    }

    const og = (prop) => {
      const match = html.match(
        new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`, 'i')
      )
      return match?.[1] || null
    }

    const title =
      og('title') ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
      null

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders(),
      },
      body: JSON.stringify({
        title,
        description: og('description'),
        image: og('image'),
        site_name: og('site_name'),
        url: og('url') || targetUrl,
      }),
    }
  } catch {
    return { statusCode: 502, headers: corsHeaders(), body: 'Failed to fetch URL' }
  }
}
