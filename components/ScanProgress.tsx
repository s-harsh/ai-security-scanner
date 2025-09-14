'use client'

import { ScanProgress as ScanProgressType } from '@/types'
import { Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface ScanProgressProps {
  progress: ScanProgressType
}

export default function ScanProgress({ progress }: ScanProgressProps) {
  const getStageIcon = (stage: string) => {
    if (stage.includes('Error') || stage.includes('Failed')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    if (stage === 'Complete') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (stage.includes('Scanning')) {
      return <Shield className="h-5 w-5 text-blue-500 scan-pulse" />
    }
    return <Clock className="h-5 w-5 text-gray-500" />
  }

  const getStageColor = (stage: string) => {
    if (stage.includes('Error') || stage.includes('Failed')) {
      return 'text-red-600'
    }
    if (stage === 'Complete') {
      return 'text-green-600'
    }
    if (stage.includes('Scanning')) {
      return 'text-blue-600'
    }
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        {getStageIcon(progress.stage)}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Security Scan in Progress</h3>
          <p className={`text-sm ${getStageColor(progress.stage)}`}>
            {progress.message}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{progress.stage}</span>
          <span>{Math.round(progress.progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Extracting', completed: progress.stage !== 'Initializing' },
          { name: 'Analyzing', completed: progress.stage.includes('Analyzing') || progress.stage.includes('Scanning') || progress.stage === 'Complete' },
          { name: 'Scanning', completed: progress.stage.includes('Scanning') || progress.stage === 'Complete' },
          { name: 'Complete', completed: progress.stage === 'Complete' }
        ].map((stage, index) => (
          <div key={stage.name} className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              stage.completed 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {stage.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`text-sm ${
              stage.completed ? 'text-green-600 font-medium' : 'text-gray-500'
            }`}>
              {stage.name}
            </span>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">What we're scanning for:</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• SQL Injection vulnerabilities</li>
              <li>• Cross-Site Scripting (XSS) risks</li>
              <li>• Code injection patterns</li>
              <li>• Hardcoded secrets and credentials</li>
              <li>• Path traversal vulnerabilities</li>
              <li>• Weak cryptographic implementations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
