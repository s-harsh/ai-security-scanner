const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { v4: uuidv4 } = require('uuid')
const SecurityScanner = require('./scanner/SecurityScanner')
const FileProcessor = require('./utils/FileProcessor')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.tar', '.gz', '.tgz']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext) || file.mimetype === 'application/zip') {
      cb(null, true)
    } else {
      cb(new Error('Only archive files are allowed'))
    }
  }
})

// In-memory storage for scan results (in production, use a database)
const scanResults = new Map()
const scanProgress = new Map()

// Routes
app.post('/api/scan/upload', upload.single('plugin'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      })
    }

    const scanId = uuidv4()
    const filePath = req.file.path
    
    // Initialize scan progress
    scanProgress.set(scanId, {
      stage: 'Initializing',
      progress: 0,
      message: 'Starting security scan...'
    })

    // Start scanning in background
    scanPlugin(scanId, filePath, req.file.originalname)

    res.json({
      success: true,
      scanId,
      message: 'Scan initiated successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/scan/repository', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Repository URL is required'
      })
    }

    const scanId = uuidv4()
    
    // Initialize scan progress
    scanProgress.set(scanId, {
      stage: 'Cloning Repository',
      progress: 0,
      message: 'Cloning repository...'
    })

    // Start scanning in background
    scanRepository(scanId, url)

    res.json({
      success: true,
      scanId,
      message: 'Repository scan initiated successfully'
    })
  } catch (error) {
    console.error('Repository scan error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.get('/api/scan/:scanId/progress', (req, res) => {
  const { scanId } = req.params
  const progress = scanProgress.get(scanId)
  
  if (!progress) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    })
  }

  res.json({
    success: true,
    data: progress
  })
})

app.get('/api/scan/:scanId/results', (req, res) => {
  const { scanId } = req.params
  const result = scanResults.get(scanId)
  
  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Scan results not found'
    })
  }

  res.json({
    success: true,
    data: result
  })
})

app.get('/api/scans/history', (req, res) => {
  const history = Array.from(scanResults.values())
    .sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate))
    .slice(0, 20) // Return last 20 scans

  res.json({
    success: true,
    data: history
  })
})

// Background scanning functions
async function scanPlugin(scanId, filePath, originalName) {
  try {
    const scanner = new SecurityScanner()
    const fileProcessor = new FileProcessor()

    // Update progress
    updateProgress(scanId, 'Extracting Files', 20, 'Extracting plugin files...')

    // Extract files
    const extractedPath = await fileProcessor.extractArchive(filePath, originalName)
    
    updateProgress(scanId, 'Analyzing Files', 40, 'Analyzing plugin structure...')

    // Get plugin info
    const pluginInfo = await fileProcessor.getPluginInfo(extractedPath)
    
    updateProgress(scanId, 'Security Scanning', 60, 'Running security checks...')

    // Run security scan
    const issues = await scanner.scanDirectory(extractedPath, (progress) => {
      updateProgress(scanId, 'Security Scanning', 60 + (progress * 0.3), 'Scanning for vulnerabilities...')
    })

    updateProgress(scanId, 'Generating Report', 95, 'Finalizing scan results...')

    // Create scan result
    const result = {
      id: scanId,
      pluginName: pluginInfo.name || path.basename(originalName, path.extname(originalName)),
      pluginVersion: pluginInfo.version,
      scanDate: new Date().toISOString(),
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      mediumIssues: issues.filter(i => i.severity === 'medium').length,
      lowIssues: issues.filter(i => i.severity === 'low').length,
      infoIssues: issues.filter(i => i.severity === 'info').length,
      issues,
      scanDuration: Date.now() - parseInt(scanId.split('-')[0]),
      status: 'completed'
    }

    scanResults.set(scanId, result)
    updateProgress(scanId, 'Complete', 100, 'Scan completed successfully')

    // Cleanup
    await fileProcessor.cleanup(extractedPath)
    await fs.unlink(filePath).catch(() => {}) // Ignore errors
    
  } catch (error) {
    console.error('Scan error:', error)
    scanResults.set(scanId, {
      id: scanId,
      status: 'failed',
      error: error.message,
      scanDate: new Date().toISOString()
    })
    updateProgress(scanId, 'Error', 100, `Scan failed: ${error.message}`)
  }
}

async function scanRepository(scanId, repoUrl) {
  try {
    const scanner = new SecurityScanner()
    const fileProcessor = new FileProcessor()

    updateProgress(scanId, 'Cloning Repository', 20, 'Cloning repository...')

    const clonedPath = await fileProcessor.cloneRepository(repoUrl)
    
    updateProgress(scanId, 'Analyzing Repository', 40, 'Analyzing repository structure...')

    const pluginInfo = await fileProcessor.getPluginInfo(clonedPath)
    
    updateProgress(scanId, 'Security Scanning', 60, 'Running security checks...')

    const issues = await scanner.scanDirectory(clonedPath, (progress) => {
      updateProgress(scanId, 'Security Scanning', 60 + (progress * 0.3), 'Scanning for vulnerabilities...')
    })

    updateProgress(scanId, 'Generating Report', 95, 'Finalizing scan results...')

    const result = {
      id: scanId,
      pluginName: pluginInfo.name || path.basename(repoUrl, '.git'),
      pluginVersion: pluginInfo.version,
      scanDate: new Date().toISOString(),
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      mediumIssues: issues.filter(i => i.severity === 'medium').length,
      lowIssues: issues.filter(i => i.severity === 'low').length,
      infoIssues: issues.filter(i => i.severity === 'info').length,
      issues,
      scanDuration: Date.now() - parseInt(scanId.split('-')[0]),
      status: 'completed'
    }

    scanResults.set(scanId, result)
    updateProgress(scanId, 'Complete', 100, 'Scan completed successfully')

    // Cleanup
    await fileProcessor.cleanup(clonedPath)
    
  } catch (error) {
    console.error('Repository scan error:', error)
    scanResults.set(scanId, {
      id: scanId,
      status: 'failed',
      error: error.message,
      scanDate: new Date().toISOString()
    })
    updateProgress(scanId, 'Error', 100, `Scan failed: ${error.message}`)
  }
}

function updateProgress(scanId, stage, progress, message) {
  scanProgress.set(scanId, { stage, progress, message })
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Security Scanner API running on port ${PORT}`)
  console.log(`📊 Dashboard available at http://localhost:3000`)
})
