'use client'

import { useState, useEffect } from 'react'
import { ScanResult } from '@/types'
import { 
  Clock, 
  FileText, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Shield,
  Trash2
} from 'lucide-react'

interface ScanHistoryProps {
  onSelectScan: (result: ScanResult) => void
}

export default function ScanHistory({ onSelectScan }: ScanHistoryProps) {
  const [scans, setScans] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchScanHistory()
  }, [])

  const fetchScanHistory = async () => {
    try {
      const response = await fetch('/api/scans/history')
      const data = await response.json()
      
      if (data.success) {
        setScans(data.data)
      } else {
        setError(data.error || 'Failed to fetch scan history')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'scanning':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scan history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading history</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchScanHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No scan history</h3>
        <p className="text-gray-600">Start by uploading a plugin or scanning a repository.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Scan History</h2>
        <div className="text-sm text-gray-600">
          {scans.length} scan{scans.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="space-y-4">
        {scans.map((scan) => (
          <div
            key={scan.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectScan(scan)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {scan.pluginName}
                  </h3>
                  {scan.pluginVersion && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      v{scan.pluginVersion}
                    </span>
                  )}
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(scan.status)}
                    <span className="text-sm text-gray-600 capitalize">{scan.status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(scan.scanDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Duration: {formatDuration(scan.scanDuration)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Issues: {scan.totalIssues}</span>
                  </div>
                </div>

                {/* Severity Breakdown */}
                <div className="flex items-center space-x-4">
                  {scan.criticalIssues > 0 && (
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon('critical')}
                      <span className="text-sm text-red-600 font-medium">
                        {scan.criticalIssues} Critical
                      </span>
                    </div>
                  )}
                  {scan.highIssues > 0 && (
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon('high')}
                      <span className="text-sm text-orange-600 font-medium">
                        {scan.highIssues} High
                      </span>
                    </div>
                  )}
                  {scan.mediumIssues > 0 && (
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon('medium')}
                      <span className="text-sm text-yellow-600 font-medium">
                        {scan.mediumIssues} Medium
                      </span>
                    </div>
                  )}
                  {scan.lowIssues > 0 && (
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon('low')}
                      <span className="text-sm text-blue-600 font-medium">
                        {scan.lowIssues} Low
                      </span>
                    </div>
                  )}
                  {scan.infoIssues > 0 && (
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon('info')}
                      <span className="text-sm text-gray-600 font-medium">
                        {scan.infoIssues} Info
                      </span>
                    </div>
                  )}
                </div>

                {scan.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {scan.error}
                    </p>
                  </div>
                )}
              </div>

              <div className="ml-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Click to view details</div>
                  <div className="text-xs text-gray-400">ID: {scan.id.slice(0, 8)}...</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
