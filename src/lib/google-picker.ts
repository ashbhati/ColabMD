type PickerSelection = {
  fileId: string
  name: string
}

declare global {
  interface Window {
    gapi?: {
      load: (module: string, options: { callback: () => void; onerror?: () => void }) => void
    }
    google?: {
      picker?: {
        Action: {
          PICKED: string
          CANCEL: string
        }
        Response: {
          ACTION: string
          DOCUMENTS: string
        }
        Document: {
          ID: string
          NAME: string
        }
        ViewId: {
          DOCS: string
        }
        DocsView: new (viewId: string) => {
          setIncludeFolders: (enabled: boolean) => void
          setSelectFolderEnabled: (enabled: boolean) => void
          setMimeTypes: (mimeTypes: string) => void
          setQuery: (query: string) => void
        }
        PickerBuilder: new () => {
          addView: (view: unknown) => unknown
          setOAuthToken: (token: string) => unknown
          setDeveloperKey: (key: string) => unknown
          setAppId: (appId: string) => unknown
          setCallback: (callback: (data: Record<string, unknown>) => void) => unknown
          build: () => { setVisible: (visible: boolean) => void }
        }
      }
    }
  }
}

let googleApiScriptPromise: Promise<void> | null = null
let pickerApiPromise: Promise<void> | null = null

function loadGoogleApiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Picker is only available in the browser'))
  }

  if (window.gapi) {
    return Promise.resolve()
  }

  if (googleApiScriptPromise) {
    return googleApiScriptPromise
  }

  googleApiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-api-script="picker"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google API script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.dataset.googleApiScript = 'picker'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google API script'))
    document.head.appendChild(script)
  })

  return googleApiScriptPromise
}

function loadPickerApi(): Promise<void> {
  if (pickerApiPromise) {
    return pickerApiPromise
  }

  pickerApiPromise = loadGoogleApiScript().then(
    () =>
      new Promise<void>((resolve, reject) => {
        if (!window.gapi) {
          reject(new Error('Google API client not available'))
          return
        }

        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to initialize Google Picker API')),
        })
      })
  )

  return pickerApiPromise
}

export async function openGoogleDriveMarkdownPicker(options: {
  accessToken: string
  apiKey: string
  appId?: string
}): Promise<PickerSelection | null> {
  const { accessToken, apiKey, appId } = options
  await loadPickerApi()

  return new Promise<PickerSelection | null>((resolve, reject) => {
    if (!window.google?.picker) {
      reject(new Error('Google Picker API is unavailable'))
      return
    }

    const picker = window.google.picker

    const docsView = new picker.DocsView(picker.ViewId.DOCS)
    docsView.setIncludeFolders(false)
    docsView.setSelectFolderEnabled(false)
    docsView.setMimeTypes('text/markdown,text/x-markdown,text/plain')
    docsView.setQuery('*.md')

    const builder = new picker.PickerBuilder()
      .addView(docsView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((data) => {
        const action = data[picker.Response.ACTION] as string | undefined

        if (action === picker.Action.PICKED) {
          const docs = (data[picker.Response.DOCUMENTS] as Record<string, unknown>[] | undefined) || []
          const first = docs[0]
          const fileId = first?.[picker.Document.ID]
          const name = first?.[picker.Document.NAME]

          if (typeof fileId === 'string' && typeof name === 'string') {
            resolve({ fileId, name })
            return
          }

          reject(new Error('Invalid file selection from Google Picker'))
          return
        }

        if (action === picker.Action.CANCEL) {
          resolve(null)
        }
      })

    if (appId) {
      builder.setAppId(appId)
    }

    builder.build().setVisible(true)
  })
}
