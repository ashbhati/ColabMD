export type GoogleDriveFileRef = {
  fileId: string
}

export type GoogleDriveFileMetadata = {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

const DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,}$/

export function parseGoogleDriveFileRef(input: { fileUrl?: string; fileId?: string }): GoogleDriveFileRef | null {
  const rawId = input.fileId?.trim()
  if (rawId && DRIVE_FILE_ID_REGEX.test(rawId)) {
    return { fileId: rawId }
  }

  const rawUrl = input.fileUrl?.trim()
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)

    const host = url.hostname.toLowerCase()
    const allowedHosts = ['drive.google.com', 'docs.google.com', 'googleusercontent.com']
    const isAllowedHost =
      allowedHosts.includes(host) ||
      host.endsWith('.google.com') ||
      host.endsWith('.googleusercontent.com')

    if (!isAllowedHost) {
      return null
    }

    const pathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/)
    if (pathMatch?.[1]) {
      return { fileId: pathMatch[1] }
    }

    const queryId = url.searchParams.get('id')
    if (queryId && DRIVE_FILE_ID_REGEX.test(queryId)) {
      return { fileId: queryId }
    }

    return null
  } catch {
    return null
  }
}

export function isMarkdownMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false

  const normalized = mimeType.toLowerCase()
  return normalized === 'text/markdown' || normalized === 'text/x-markdown' || normalized === 'text/plain'
}

export function isMarkdownFilename(fileName: string | null | undefined): boolean {
  if (!fileName) return false
  return fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown')
}

export async function fetchGoogleDriveFileMetadata(fileId: string, accessToken: string): Promise<GoogleDriveFileMetadata> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch Google Drive metadata (${response.status}): ${text}`)
  }

  return response.json()
}

export async function fetchGoogleDriveFileContent(fileId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch Google Drive file content (${response.status}): ${text}`)
  }

  return response.text()
}
