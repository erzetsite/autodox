import React, { useState } from 'react'
import { Upload, FileText, Download } from 'lucide-react'

interface UploadState {
  file: File | null
  loading: boolean
  error: string | null
}

export default function UploadBox() {
  const [state, setState] = useState<UploadState>({
    file: null,
    loading: false,
    error: null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.docx')) {
      setState({ ...state, file, error: null })
    } else {
      setState({ ...state, error: 'Please upload a .docx file' })
    }
  }

  const handleUpload = async () => {
    if (!state.file) return
    setState({ ...state, loading: true, error: null })

    const formData = new FormData()
    formData.append('file', state.file)

    try {
      const res = await fetch('https://api.autodox.rzsite.my.id/format', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'formatted_autodox.docx'
      a.click()
      URL.revokeObjectURL(url)

      setState({ file: null, loading: false, error: null })
    } catch {
      setState({ ...state, loading: false, error: 'Failed to process document' })
    }
  }

  return (
    <div className="bg-[--card] rounded-12 shadow-sm p-8 animate-fade-in">
      <div className="text-center mb-6">
        <Upload className="w-12 h-12 mx-auto mb-4 text-accent-500" />
        <h2 className="text-xl font-semibold mb-2">Upload Dokumen Anda</h2>
        <p className="text-sm opacity-70">Format otomatis dengan penomoran halaman campuran</p>
      </div>

      <label className="block w-full">
        <input type="file" accept=".docx" onChange={handleFileChange} className="hidden" />
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-12 p-6 text-center cursor-pointer hover:border-accent-500 transition-colors">
          {state.file ? (
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-6 h-6 text-accent-500" />
              <span>{state.file.name}</span>
            </div>
          ) : (
            <span>Klik untuk memilih file .docx</span>
          )}
        </div>
      </label>

      {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}

      <button
        onClick={handleUpload}
        disabled={!state.file || state.loading}
        className="w-full mt-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 rounded-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
      >
        {state.loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Format Dokumen
          </span>
        )}
      </button>
    </div>
  )
}
