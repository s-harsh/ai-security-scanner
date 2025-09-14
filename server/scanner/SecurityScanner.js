const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const FixSuggester = require('../ai/FixSuggester')

class SecurityScanner {
  constructor() {
    this.rules = this.initializeRules()
    this.fixSuggester = new FixSuggester()
  }

  initializeRules() {
    return [
      // JavaScript/Node.js Security Rules
      {
        id: 'js-eval-usage',
        pattern: /\beval\s*\(/gi,
        severity: 'critical',
        category: 'Code Injection',
        title: 'Dangerous eval() Usage',
        description: 'Use of eval() can lead to code injection vulnerabilities',
        cwe: 'CWE-95',
        owasp: 'A03:2021 – Injection',
        suggestedFix: 'Replace eval() with safer alternatives like JSON.parse() for data or Function constructor for controlled code execution'
      },
      {
        id: 'js-sql-injection',
        pattern: /(?:query|execute|exec)\s*\(\s*[`"'].*?\$\{.*?\}.*?[`"']/gi,
        severity: 'critical',
        category: 'SQL Injection',
        title: 'Potential SQL Injection',
        description: 'Dynamic SQL query construction detected',
        cwe: 'CWE-89',
        owasp: 'A03:2021 – Injection',
        suggestedFix: 'Use parameterized queries or prepared statements instead of string concatenation'
      },
      {
        id: 'js-command-injection',
        pattern: /(?:exec|spawn|execSync|spawnSync)\s*\(\s*[`"'].*?\$\{.*?\}.*?[`"']/gi,
        severity: 'critical',
        category: 'Command Injection',
        title: 'Command Injection Risk',
        description: 'Dynamic command execution with user input detected',
        cwe: 'CWE-78',
        owasp: 'A03:2021 – Injection',
        suggestedFix: 'Validate and sanitize input, use execFile() with argument arrays instead of shell commands'
      },
      {
        id: 'js-path-traversal',
        pattern: /(?:readFile|writeFile|unlink|rmdir|mkdir)\s*\([^)]*\.\.\//gi,
        severity: 'high',
        category: 'Path Traversal',
        title: 'Path Traversal Vulnerability',
        description: 'Potential directory traversal attack detected',
        cwe: 'CWE-22',
        owasp: 'A01:2021 – Broken Access Control',
        suggestedFix: 'Validate file paths and use path.resolve() to prevent directory traversal'
      },
      {
        id: 'js-xss-innerHTML',
        pattern: /\.innerHTML\s*=\s*[^;]+(?:\+|`|\$\{)/gi,
        severity: 'high',
        category: 'Cross-Site Scripting',
        title: 'XSS via innerHTML',
        description: 'Dynamic content assignment to innerHTML can lead to XSS',
        cwe: 'CWE-79',
        owasp: 'A03:2021 – Injection',
        suggestedFix: 'Use textContent instead of innerHTML or sanitize HTML content'
      },
      {
        id: 'js-weak-crypto',
        pattern: /(?:md5|sha1|des|rc4)\s*\(/gi,
        severity: 'medium',
        category: 'Weak Cryptography',
        title: 'Weak Cryptographic Algorithm',
        description: 'Use of weak or deprecated cryptographic algorithms',
        cwe: 'CWE-327',
        owasp: 'A02:2021 – Cryptographic Failures',
        suggestedFix: 'Use stronger algorithms like SHA-256, SHA-3, or AES for encryption'
      },
      {
        id: 'js-hardcoded-secrets',
        pattern: /(?:password|secret|key|token|api_key)\s*[:=]\s*[`"'][^`"'\s]{8,}[`"']/gi,
        severity: 'high',
        category: 'Information Disclosure',
        title: 'Hardcoded Secrets',
        description: 'Potential hardcoded credentials or secrets detected',
        cwe: 'CWE-798',
        owasp: 'A07:2021 – Identification and Authentication Failures',
        suggestedFix: 'Use environment variables or secure key management systems'
      },
      {
        id: 'js-insecure-random',
        pattern: /Math\.random\(\)/gi,
        severity: 'low',
        category: 'Weak Randomness',
        title: 'Insecure Random Number Generation',
        description: 'Math.random() is not cryptographically secure',
        cwe: 'CWE-338',
        owasp: 'A02:2021 – Cryptographic Failures',
        suggestedFix: 'Use crypto.randomBytes() or crypto.getRandomValues() for security-sensitive operations'
      },
      {
        id: 'js-prototype-pollution',
        pattern: /\[.*?__proto__.*?\]|\.__proto__/gi,
        severity: 'high',
        category: 'Prototype Pollution',
        title: 'Prototype Pollution Risk',
        description: 'Direct manipulation of __proto__ detected',
        cwe: 'CWE-1321',
        owasp: 'A08:2021 – Software and Data Integrity Failures',
        suggestedFix: 'Avoid direct prototype manipulation, use Object.create() or Map for dynamic properties'
      },
      {
        id: 'js-regex-dos',
        pattern: /new RegExp\([^)]*\*.*?\*|new RegExp\([^)]*\+.*?\+/gi,
        severity: 'medium',
        category: 'Regular Expression DoS',
        title: 'ReDoS Vulnerability',
        description: 'Regular expression with potential catastrophic backtracking',
        cwe: 'CWE-1333',
        owasp: 'A06:2021 – Vulnerable and Outdated Components',
        suggestedFix: 'Optimize regex patterns to avoid excessive backtracking'
      },

      // PHP Security Rules
      {
        id: 'php-eval-usage',
        pattern: /\beval\s*\(/gi,
        severity: 'critical',
        category: 'Code Injection',
        title: 'Dangerous eval() Usage',
        description: 'Use of eval() can lead to remote code execution',
        cwe: 'CWE-95',
        owasp: 'A03:2021 – Injection'
      },
      {
        id: 'php-sql-injection',
        pattern: /(?:mysql_query|mysqli_query|query)\s*\([^)]*\$_(?:GET|POST|REQUEST)/gi,
        severity: 'critical',
        category: 'SQL Injection',
        title: 'SQL Injection Vulnerability',
        description: 'Direct use of user input in SQL queries',
        cwe: 'CWE-89',
        owasp: 'A03:2021 – Injection'
      },
      {
        id: 'php-file-inclusion',
        pattern: /(?:include|require|include_once|require_once)\s*\([^)]*\$_(?:GET|POST|REQUEST)/gi,
        severity: 'critical',
        category: 'File Inclusion',
        title: 'File Inclusion Vulnerability',
        description: 'Dynamic file inclusion with user input',
        cwe: 'CWE-98',
        owasp: 'A03:2021 – Injection'
      },

      // Python Security Rules
      {
        id: 'python-eval-usage',
        pattern: /\beval\s*\(/gi,
        severity: 'critical',
        category: 'Code Injection',
        title: 'Dangerous eval() Usage',
        description: 'Use of eval() can lead to arbitrary code execution',
        cwe: 'CWE-95',
        owasp: 'A03:2021 – Injection'
      },
      {
        id: 'python-sql-injection',
        pattern: /(?:execute|executemany)\s*\([^)]*%s[^)]*%/gi,
        severity: 'critical',
        category: 'SQL Injection',
        title: 'SQL Injection via String Formatting',
        description: 'String formatting in SQL queries can lead to injection',
        cwe: 'CWE-89',
        owasp: 'A03:2021 – Injection'
      },
      {
        id: 'python-command-injection',
        pattern: /(?:os\.system|subprocess\.call|subprocess\.run)\s*\([^)]*input\(/gi,
        severity: 'critical',
        category: 'Command Injection',
        title: 'Command Injection Risk',
        description: 'Direct use of user input in system commands',
        cwe: 'CWE-78',
        owasp: 'A03:2021 – Injection'
      },

      // Generic Security Rules
      {
        id: 'generic-debug-info',
        pattern: /(?:console\.log|print|echo|var_dump|debug)\s*\([^)]*(?:password|secret|token|key)/gi,
        severity: 'medium',
        category: 'Information Disclosure',
        title: 'Sensitive Information in Debug Output',
        description: 'Sensitive data might be exposed in debug output',
        cwe: 'CWE-200',
        owasp: 'A09:2021 – Security Logging and Monitoring Failures'
      },
      {
        id: 'generic-http-urls',
        pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/gi,
        severity: 'low',
        category: 'Insecure Communication',
        title: 'Insecure HTTP URL',
        description: 'HTTP URLs can be intercepted and modified',
        cwe: 'CWE-319',
        owasp: 'A02:2021 – Cryptographic Failures'
      }
    ]
  }

  async scanDirectory(dirPath, progressCallback) {
    const issues = []
    const files = await this.getAllFiles(dirPath)
    
    console.log(`🔍 Scanning directory: ${dirPath}`)
    console.log(`📁 Found ${files.length} files to scan:`, files)
    
    let processedFiles = 0
    const totalFiles = files.length

    for (const filePath of files) {
      try {
        console.log(`🔍 Scanning file: ${filePath}`)
        const fileIssues = await this.scanFile(filePath, dirPath)
        console.log(`📊 Found ${fileIssues.length} issues in ${filePath}`)
        issues.push(...fileIssues)
        
        processedFiles++
        if (progressCallback) {
          progressCallback(processedFiles / totalFiles)
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error)
      }
    }

    console.log(`✅ Scan complete. Total issues found: ${issues.length}`)
    return issues
  }

  async scanFile(filePath, basePath) {
    const issues = []
    
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const relativePath = path.relative(basePath, filePath)
      const lines = content.split('\n')
      
      console.log(`📄 Scanning file: ${relativePath} (${content.length} chars)`)

      for (const rule of this.rules) {
        const matches = this.findMatches(content, rule.pattern)
        console.log(`🔍 Rule ${rule.id}: Found ${matches.length} matches`)
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index)
          const lineContent = lines[lineNumber - 1] || ''
          
          console.log(`🚨 Found ${rule.severity} issue: ${rule.title} at line ${lineNumber}`)
          
          const issue = {
            id: uuidv4(),
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            category: rule.category,
            file: relativePath,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1),
            code: lineContent.trim(),
            cwe: rule.cwe,
            owasp: rule.owasp,
            confidence: this.calculateConfidence(match, rule),
            suggestedFix: rule.suggestedFix,
            references: rule.references || []
          }

          // Generate AI-powered fix suggestions
          const aiFix = this.fixSuggester.generateFix(issue)
          issue.suggestedFix = aiFix.codeExample
          issue.aiFix = aiFix

          issues.push(issue)
        }
      }
    } catch (error) {
      if (error.code !== 'EISDIR') {
        console.error(`Error reading file ${filePath}:`, error)
      }
    }

    return issues
  }

  findMatches(content, pattern) {
    const matches = []
    let match

    while ((match = pattern.exec(content)) !== null) {
      matches.push({
        match: match[0],
        index: match.index
      })
    }

    return matches
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length
  }

  calculateConfidence(match, rule) {
    // Simple confidence calculation based on pattern specificity
    if (rule.pattern.source.includes('\\$\\{') || rule.pattern.source.includes('\\+')) {
      return 'high'
    }
    if (rule.severity === 'critical') {
      return 'high'
    }
    if (rule.severity === 'high') {
      return 'medium'
    }
    return 'low'
  }

  async getAllFiles(dirPath) {
    const files = []
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Skip common directories that don't need scanning
        if (['node_modules', '.git', '.svn', 'vendor', '__pycache__', '.pytest_cache'].includes(entry.name)) {
          continue
        }
        const subFiles = await this.getAllFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        // Only scan relevant file types
        const ext = path.extname(entry.name).toLowerCase()
        if (['.js', '.jsx', '.ts', '.tsx', '.php', '.py', '.java', '.go', '.rb', '.cs', '.cpp', '.c', '.h'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }

    return files
  }
}

module.exports = SecurityScanner
