'use client'

import { useState } from 'react'
import { ScanResult, SecurityIssue } from '@/types'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock, 
  Shield, 
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ScanResultsProps {
  results: ScanResult
}

export default function ScanResults({ results }: ScanResultsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'severity' | 'file' | 'category'>('severity')

  const severityConfig = {
    critical: { 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      count: results.criticalIssues
    },
    high: { 
      icon: AlertCircle, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-200',
      count: results.highIssues
    },
    medium: { 
      icon: Info, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      count: results.mediumIssues
    },
    low: { 
      icon: Info, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      count: results.lowIssues
    },
    info: { 
      icon: CheckCircle, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50', 
      borderColor: 'border-gray-200',
      count: results.infoIssues
    }
  }

  const filteredIssues = results.issues.filter(issue => 
    selectedSeverity === 'all' || issue.severity === selectedSeverity
  )

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    if (sortBy === 'file') {
      return a.file.localeCompare(b.file)
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category)
    }
    return 0
  })

  const toggleIssueExpansion = (issueId: string) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedIssues(newExpanded)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(severityConfig).map(([severity, config]) => {
          const Icon = config.icon
          return (
            <div
              key={severity}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSeverity === severity
                  ? `${config.bgColor} ${config.borderColor} ring-2 ring-offset-2 ring-current`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedSeverity(selectedSeverity === severity ? 'all' : severity)}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <div>
                  <p className={`text-sm font-medium ${config.color}`}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{config.count}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scan Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Plugin:</span>
            <span className="font-medium">{results.pluginName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{formatDuration(results.scanDuration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Total Issues:</span>
            <span className="font-medium">{results.totalIssues}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="severity">Severity</option>
              <option value="file">File</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredIssues.length} of {results.issues.length} issues
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {sortedIssues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found!</h3>
            <p className="text-gray-600">This plugin appears to be secure for the selected criteria.</p>
          </div>
        ) : (
          sortedIssues.map((issue) => {
            const config = severityConfig[issue.severity]
            const Icon = config.icon
            const isExpanded = expandedIssues.has(issue.id)

            return (
              <div
                key={issue.id}
                className={`border rounded-lg ${config.borderColor} ${config.bgColor}`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleIssueExpansion(issue.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {issue.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} ${config.bgColor}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{issue.file}</span>
                            {issue.line && <span>:{issue.line}</span>}
                          </span>
                          <span>{issue.category}</span>
                          {issue.cwe && (
                            <a
                              href={`https://cwe.mitre.org/data/definitions/${issue.cwe.replace('CWE-', '')}.html`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 hover:text-gray-700"
                            >
                              <span>{issue.cwe}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                    <div className="pt-4 space-y-4">
                      {/* Code Snippet */}
                      {issue.code && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Code:</h5>
                          <div className="rounded-lg overflow-hidden">
                            <SyntaxHighlighter
                              language="javascript"
                              style={tomorrow}
                              customStyle={{
                                margin: 0,
                                fontSize: '0.875rem',
                                lineHeight: '1.5'
                              }}
                            >
                              {issue.code}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )}

                      {/* Suggested Fix */}
                      {issue.suggestedFix && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Suggested Fix:</h5>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">{issue.suggestedFix}</p>
                          </div>
                        </div>
                      )}

                      {/* References */}
                      {issue.references && issue.references.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">References:</h5>
                          <ul className="space-y-1">
                            {issue.references.map((ref, index) => (
                              <li key={index}>
                                <a
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <span>{ref}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
