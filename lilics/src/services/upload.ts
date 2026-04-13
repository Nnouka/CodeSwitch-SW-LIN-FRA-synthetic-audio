export async function uploadWithPresignedUrl(url: string, file: Blob): Promise<void> {
  const contentType = file.type || 'audio/webm'
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }
}
