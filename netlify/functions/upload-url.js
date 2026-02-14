import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const s3 = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  const { filename, contentType } = JSON.parse(event.body)
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, cdnUrl }),
  }
}
