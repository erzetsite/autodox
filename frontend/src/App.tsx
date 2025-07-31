import React from 'react'
import UploadBox from './components/UploadBox'

function App() {
  return (
    <div className="min-h-screen bg-[--background] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent">
          AutoDOCx v2
        </h1>
        <UploadBox />
      </div>
    </div>
  )
}

export default App
