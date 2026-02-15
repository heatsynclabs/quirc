import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'https://quirc.chat')
  .split(',')
  .map(s => s.trim())
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const ALLOWED_CONTENT_TYPES = [
  /^image\//,
  /^video\//,
  /^audio\//,
  /^application\/pdf$/,
  /^text\/plain$/,
]

function corsHeaders(event) {
  const origin = event?.headers?.origin || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function isAllowedContentType(ct) {
  return ALLOWED_CONTENT_TYPES.some(p => p.test(ct))
}

function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  if (filename.includes('..') || filename.includes('//') || filename.includes('\\')) return false
  if (filename.includes('\0')) return false
  if (filename.length > 255) return false
  return true
}

const s3 = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
})

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(event) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: corsHeaders(event), body: 'Invalid JSON' }
  }

  const { filename, contentType } = body

  if (!isValidFilename(filename)) {
    return { statusCode: 400, headers: corsHeaders(event), body: 'Invalid filename' }
  }

  if (!contentType || !isAllowedContentType(contentType)) {
    return {
      statusCode: 400,
      headers: corsHeaders(event),
      body: 'Content type not allowed. Allowed: image/*, video/*, audio/*, application/pdf, text/plain',
    }
  }

  const ext = filename.split('.').pop()
  const key = `uploads/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    }),
    { expiresIn: 300 }
  )

  const cdnUrl = `https://${process.env.DO_SPACES_CDN_DOMAIN}/${key}`

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(event) },
    body: JSON.stringify({ url, cdnUrl }),
  }
}
