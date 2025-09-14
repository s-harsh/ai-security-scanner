'use client'

import { useState, useEffect } from 'react'
import { Upload, Github, Shield, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import UploadSection from '@/components/UploadSection'
import ScanProgress from '@/components/ScanProgress'
import ScanResults from '@/components/ScanResults'
import ScanHistory from '@/components/ScanHistory'
import { ScanResult, ScanProgress as ScanProgressType } from '@/types'

export default function Home() {
  const [currentScan, setCurrentScan] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<ScanProgressType | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const pollProgress = async (scanId: string) => {
    try {
      const response = await fetch(`/api/scan/${scanId}/progress`)
      const data = await response.json()
      
      if (data.success) {
        setScanProgress(data.data)
        
        if (data.data.progress >= 100) {
          // Fetch final results
          const resultsResponse = await fetch(`/api/scan/${scanId}/results`)
          const resultsData = await resultsResponse.json()
          
          if (resultsData.success) {
            setScanResults(resultsData.data)
            setCurrentScan(null)
            setScanProgress(null)
          }
        } else {
          // Continue polling
          setTimeout(() => pollProgress(scanId), 1000)
        }
      }
    } catch (error) {
      console.error('Error polling progress:', error)
    }
  }

  const handleScanStart = (scanId: string) => {
    setCurrentScan(scanId)
    setScanResults(null)
    setScanProgress({ stage: 'Starting', progress: 0, message: 'Initializing scan...' })
    pollProgress(scanId)
  }

  const handleNewScan = () => {
    setCurrentScan(null)
    setScanProgress(null)
    setScanResults(null)
    setShowHistory(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SecureScan</h1>
                <p className="text-sm text-gray-500">Plugin Security Scanner</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>History</span>
              </button>
              
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showHistory ? (
          <ScanHistory onSelectScan={(result) => {
            setScanResults(result)
            setShowHistory(false)
          }} />
        ) : (
          <>
            {/* Hero Section */}
            {!currentScan && !scanResults && (
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Secure Your Plugins
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Advanced security scanning for plugins and repositories with AI-powered fix suggestions. 
                  Upload a ZIP file or provide a Git repository URL to get started.
                </p>
              </div>
            )}

            {/* Upload Section */}
            {!currentScan && !scanResults && (
              <div className="mb-8">
                <UploadSection onScanStart={handleScanStart} />
              </div>
            )}

            {/* Scan Progress */}
            {currentScan && scanProgress && (
              <div className="mb-8">
                <ScanProgress progress={scanProgress} />
              </div>
            )}

            {/* Scan Results */}
            {scanResults && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Scan Results</h3>
                  <button
                    onClick={handleNewScan}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    New Scan
                  </button>
                </div>
                <ScanResults results={scanResults} />
              </div>
            )}

            {/* Features Section */}
            {!currentScan && !scanResults && (
              <div className="grid md:grid-cols-3 gap-8 mt-16">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Scanning</h3>
                  <p className="text-gray-600">
                    Detects SQL injection, XSS, code injection, and other critical vulnerabilities across multiple languages.
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Fixes</h3>
                  <p className="text-gray-600">
                    Get intelligent suggestions for fixing security issues with detailed explanations and code examples.
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
                  <p className="text-gray-600">
                    Quick scanning with real-time progress updates and comprehensive reporting for immediate action.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 SecureScan. Built with security in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
