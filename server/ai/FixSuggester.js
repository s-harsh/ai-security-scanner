class FixSuggester {
  constructor() {
    this.fixTemplates = this.initializeFixTemplates()
  }

  initializeFixTemplates() {
    return {
      'js-eval-usage': {
        title: 'Replace eval() with safer alternatives',
        description: 'eval() can execute arbitrary code and should be avoided',
        codeExample: `// Instead of:
eval(userInput)

// Use:
JSON.parse(userInput) // for data
Function('return ' + userInput)() // for controlled code
// or better yet, use a proper parser library`,
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval',
          'https://owasp.org/www-community/attacks/Code_Injection'
        ]
      },
      'js-sql-injection': {
        title: 'Use parameterized queries',
        description: 'Prevent SQL injection by using parameterized queries or prepared statements',
        codeExample: `// Instead of:
const query = "SELECT * FROM users WHERE id = " + userId

// Use:
const query = "SELECT * FROM users WHERE id = ?"
db.query(query, [userId])

// Or with an ORM:
User.findById(userId)`,
        references: [
          'https://owasp.org/www-community/attacks/SQL_Injection',
          'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'
        ]
      },
      'js-command-injection': {
        title: 'Use execFile() with argument arrays',
        description: 'Prevent command injection by avoiding shell commands and using argument arrays',
        codeExample: `// Instead of:
exec("rm -rf " + userInput)

// Use:
execFile('rm', ['-rf', userInput], (error, stdout, stderr) => {
  // handle result
})

// Or better yet, validate input and use specific commands`,
        references: [
          'https://owasp.org/www-community/attacks/Command_Injection',
          'https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback'
        ]
      },
      'js-path-traversal': {
        title: 'Validate and sanitize file paths',
        description: 'Prevent directory traversal attacks by validating file paths',
        codeExample: `// Instead of:
readFile("../" + userInput)

// Use:
const path = require('path')
const safePath = path.resolve('./uploads', path.basename(userInput))
if (!safePath.startsWith(path.resolve('./uploads'))) {
  throw new Error('Invalid file path')
}
readFile(safePath)`,
        references: [
          'https://owasp.org/www-community/attacks/Path_Traversal',
          'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html'
        ]
      },
      'js-xss-innerHTML': {
        title: 'Use textContent or sanitize HTML',
        description: 'Prevent XSS by avoiding innerHTML with user content',
        codeExample: `// Instead of:
element.innerHTML = userContent

// Use:
element.textContent = userContent

// Or sanitize HTML:
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userContent)`,
        references: [
          'https://owasp.org/www-community/attacks/Cross_Site_Scripting_(XSS)',
          'https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html'
        ]
      },
      'js-weak-crypto': {
        title: 'Use stronger cryptographic algorithms',
        description: 'Replace weak or deprecated cryptographic functions with secure alternatives',
        codeExample: `// Instead of:
const hash = crypto.createHash('md5').update(data).digest('hex')

// Use:
const hash = crypto.createHash('sha256').update(data).digest('hex')

// For passwords, use bcrypt:
const bcrypt = require('bcrypt')
const hashedPassword = await bcrypt.hash(password, 12)`,
        references: [
          'https://owasp.org/www-community/controls/Choosing_the_Right_Cryptographic_Algorithm',
          'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'
        ]
      },
      'js-hardcoded-secrets': {
        title: 'Use environment variables or secure key management',
        description: 'Never hardcode secrets in source code',
        codeExample: `// Instead of:
const apiKey = "sk-1234567890abcdef"

// Use:
const apiKey = process.env.API_KEY

// Or use a key management service:
const apiKey = await keyManager.getSecret('api-key')`,
        references: [
          'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials',
          'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
        ]
      },
      'js-insecure-random': {
        title: 'Use cryptographically secure random number generation',
        description: 'Math.random() is not suitable for security-sensitive operations',
        codeExample: `// Instead of:
const token = Math.random().toString(36)

// Use:
const crypto = require('crypto')
const token = crypto.randomBytes(32).toString('hex')

// Or for UUIDs:
const { v4: uuidv4 } = require('uuid')
const token = uuidv4()`,
        references: [
          'https://owasp.org/www-community/vulnerabilities/Weak_Random_Number_Generator',
          'https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback'
        ]
      },
      'js-prototype-pollution': {
        title: 'Avoid direct prototype manipulation',
        description: 'Prototype pollution can lead to security vulnerabilities',
        codeExample: `// Instead of:
obj.__proto__.isAdmin = true

// Use:
const safeObj = Object.create(null)
safeObj.isAdmin = true

// Or use Map for dynamic properties:
const properties = new Map()
properties.set('isAdmin', true)`,
        references: [
          'https://owasp.org/www-community/attacks/Prototype_Pollution',
          'https://github.com/HoLyVieR/prototype-pollution-nsec18'
        ]
      }
    }
  }

  generateFix(issue) {
    const template = this.fixTemplates[issue.id] || this.generateGenericFix(issue)
    
    return {
      title: template.title,
      description: template.description,
      codeExample: template.codeExample,
      references: template.references,
      confidence: this.calculateConfidence(issue),
      priority: this.getPriority(issue.severity)
    }
  }

  generateGenericFix(issue) {
    const severityActions = {
      critical: 'immediately address',
      high: 'urgently fix',
      medium: 'should be resolved',
      low: 'consider fixing',
      info: 'review and improve'
    }

    return {
      title: `Fix ${issue.category} vulnerability`,
      description: `This ${issue.severity} severity issue should be ${severityActions[issue.severity] || 'addressed'}.`,
      codeExample: `// Review the code in ${issue.file}${issue.line ? ` at line ${issue.line}` : ''}
// ${issue.description}

// Consider implementing proper input validation,
// output encoding, and security controls.`,
      references: [
        'https://owasp.org/www-community/',
        'https://cheatsheetseries.owasp.org/'
      ]
    }
  }

  calculateConfidence(issue) {
    // Higher confidence for specific patterns we have templates for
    if (this.fixTemplates[issue.id]) {
      return 'high'
    }
    
    // Medium confidence for known vulnerability types
    const knownTypes = ['SQL Injection', 'XSS', 'Code Injection', 'Path Traversal']
    if (knownTypes.some(type => issue.category.includes(type))) {
      return 'medium'
    }
    
    return 'low'
  }

  getPriority(severity) {
    const priorities = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      info: 5
    }
    return priorities[severity] || 5
  }

  generateSecurityRecommendations(scanResults) {
    const recommendations = []
    
    // Analyze scan results for patterns
    const criticalIssues = scanResults.issues.filter(i => i.severity === 'critical')
    const highIssues = scanResults.issues.filter(i => i.severity === 'high')
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Immediate Action Required',
        description: `Found ${criticalIssues.length} critical security issues that need immediate attention.`,
        actions: [
          'Review all critical issues immediately',
          'Implement fixes before deploying to production',
          'Consider temporary workarounds if fixes take time'
        ]
      })
    }
    
    if (highIssues.length > 0) {
      recommendations.push({
        type: 'high',
        title: 'High Priority Security Issues',
        description: `Found ${highIssues.length} high-severity issues that should be addressed soon.`,
        actions: [
          'Plan fixes for high-priority issues',
          'Implement additional monitoring',
          'Review security controls'
        ]
      })
    }
    
    // Check for common patterns
    const sqlInjectionIssues = scanResults.issues.filter(i => i.category.includes('SQL Injection'))
    if (sqlInjectionIssues.length > 0) {
      recommendations.push({
        type: 'pattern',
        title: 'SQL Injection Vulnerabilities Detected',
        description: 'Multiple SQL injection issues found. Consider implementing a comprehensive database security strategy.',
        actions: [
          'Implement parameterized queries across the application',
          'Add input validation for all database inputs',
          'Consider using an ORM with built-in protection',
          'Implement database access controls'
        ]
      })
    }
    
    const xssIssues = scanResults.issues.filter(i => i.category.includes('XSS'))
    if (xssIssues.length > 0) {
      recommendations.push({
        type: 'pattern',
        title: 'Cross-Site Scripting (XSS) Vulnerabilities',
        description: 'XSS issues detected. Implement proper output encoding and input validation.',
        actions: [
          'Implement Content Security Policy (CSP)',
          'Use proper output encoding for all user-generated content',
          'Validate and sanitize all user inputs',
          'Consider using a templating engine with auto-escaping'
        ]
      })
    }
    
    return recommendations
  }
}

module.exports = FixSuggester
