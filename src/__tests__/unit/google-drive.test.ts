import {
  isMarkdownFilename,
  isMarkdownMimeType,
  parseGoogleDriveFileRef,
} from '@/lib/google-drive'

describe('google-drive utils', () => {
  describe('parseGoogleDriveFileRef', () => {
    it('parses fileId directly', () => {
      const result = parseGoogleDriveFileRef({ fileId: '1XnN_Ohs1-7zqb8TVMH-VVlJhq0BO_01D' })
      expect(result).toEqual({ fileId: '1XnN_Ohs1-7zqb8TVMH-VVlJhq0BO_01D' })
    })

    it('parses /d/<id> style urls', () => {
      const result = parseGoogleDriveFileRef({
        fileUrl: 'https://drive.google.com/file/d/1XnN_Ohs1-7zqb8TVMH-VVlJhq0BO_01D/view?usp=drive_link',
      })

      expect(result).toEqual({ fileId: '1XnN_Ohs1-7zqb8TVMH-VVlJhq0BO_01D' })
    })

    it('rejects deceptive non-google hosts', () => {
      const result = parseGoogleDriveFileRef({
        fileUrl: 'https://evilgoogle.com/file/d/1XnN_Ohs1-7zqb8TVMH-VVlJhq0BO_01D/view',
      })

      expect(result).toBeNull()
    })
  })

  describe('markdown checks', () => {
    it('accepts markdown mime types and plain text', () => {
      expect(isMarkdownMimeType('text/markdown')).toBe(true)
      expect(isMarkdownMimeType('text/x-markdown')).toBe(true)
      expect(isMarkdownMimeType('text/plain')).toBe(true)
    })

    it('accepts markdown extensions', () => {
      expect(isMarkdownFilename('notes.md')).toBe(true)
      expect(isMarkdownFilename('notes.markdown')).toBe(true)
      expect(isMarkdownFilename('notes.txt')).toBe(false)
    })
  })
})
