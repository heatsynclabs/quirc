export async function handler(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405 }

  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) return { statusCode: 400, body: 'Missing url param' }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'QUIRC-Unfurl/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

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
    return { statusCode: 502, body: 'Failed to fetch URL' }
  }
}
