export type GoogleDriveFileRef = {
  fileId: string
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

    if (!url.hostname.includes('google.com') && !url.hostname.includes('googleusercontent.com')) {
      return null
    }

    // Common Drive URLs:
    // https://drive.google.com/file/d/<id>/view
    // https://drive.google.com/open?id=<id>
    // https://docs.google.com/document/d/<id>/edit
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
  return normalized === 'text/markdown' || normalized === 'text/x-markdown'
}

export function isMarkdownFilename(fileName: string | null | undefined): boolean {
  if (!fileName) return false
  return fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown')
}
