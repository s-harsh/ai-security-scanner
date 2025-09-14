export interface SecurityIssue {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  file: string
  line?: number
  column?: number
  code?: string
  cwe?: string
  owasp?: string
  confidence: 'high' | 'medium' | 'low'
  suggestedFix?: string
  references?: string[]
}

export interface ScanResult {
  id: string
  pluginName: string
  pluginVersion?: string
  scanDate: string
  totalIssues: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  infoIssues: number
  issues: SecurityIssue[]
  scanDuration: number
  status: 'completed' | 'failed' | 'scanning'
  error?: string
}

export interface PluginInfo {
  name: string
  version?: string
  description?: string
  author?: string
  license?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  files: string[]
  size: number
}

export interface ScanProgress {
  stage: string
  progress: number
  message: string
}

export interface UploadResponse {
  success: boolean
  scanId: string
  message: string
  error?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
