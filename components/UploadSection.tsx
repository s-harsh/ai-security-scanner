'use client'

import { useState, useRef } from 'react'
import { Upload, Github, AlertCircle, CheckCircle } from 'lucide-react'
import { UploadResponse } from '@/types'

interface UploadSectionProps {
  onScanStart: (scanId: string) => void
}

export default function UploadSection({ onScanStart }: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError('')
    setSuccess('')
    setUploading(true)

    const formData = new FormData()
    formData.append('plugin', file)

    try {
      const response = await fetch('/api/scan/upload', {
        method: 'POST',
        body: formData,
      })

      const data: UploadResponse = await response.json()

      if (data.success) {
        setSuccess('File uploaded successfully! Starting scan...')
        onScanStart(data.scanId)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRepositoryScan = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL')
      return
    }

    setError('')
    setSuccess('')
    setUploading(true)

    try {
      const response = await fetch('/api/scan/repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: repoUrl }),
      })

      const data: UploadResponse = await response.json()

      if (data.success) {
        setSuccess('Repository scan initiated! Starting analysis...')
        onScanStart(data.scanId)
        setRepoUrl('')
      } else {
        setError(data.error || 'Repository scan failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Plugin</h3>
          </div>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.tar,.gz,.tgz"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploading ? 'Uploading...' : 'Drop your plugin here'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
              </div>
              
              <p className="text-xs text-gray-400">
                Supports ZIP, TAR, GZ files up to 50MB
              </p>
            </div>
          </div>
        </div>

        {/* Repository URL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Github className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Git Repository</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL
              </label>
              <input
                id="repo-url"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>
            
            <button
              onClick={handleRepositoryScan}
              disabled={uploading || !repoUrl.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Scanning...' : 'Scan Repository'}
            </button>
            
            <p className="text-xs text-gray-400">
              Supports public Git repositories (GitHub, GitLab, Bitbucket)
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className="mt-6">
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
