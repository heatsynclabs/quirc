import { ref } from 'vue'

export function useFileUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  async function upload(file) {
    const uploadApi = import.meta.env.VITE_UPLOAD_API
    if (!uploadApi) throw new Error('VITE_UPLOAD_API not configured')

    uploading.value = true
    progress.value = 0

    try {
      // 1. Get presigned URL
      const res = await fetch(uploadApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!res.ok) throw new Error('Failed to get upload URL')
      const { url, cdnUrl } = await res.json()

      // 2. Upload file with XHR for progress events
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.setRequestHeader('x-amz-acl', 'public-read')

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            progress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })

      progress.value = 100
      return cdnUrl
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    progress,
    upload,
  }
}
