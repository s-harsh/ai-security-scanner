import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Plugin Upload and Scanning', () => {
  test('should display upload interface correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check main elements are visible
    await expect(page.locator('h1')).toContainText('SecureScan')
    await expect(page.locator('h2')).toContainText('Secure Your Plugins')
    
    // Check upload sections
    await expect(page.locator('text=Upload Plugin')).toBeVisible()
    await expect(page.locator('text=Git Repository')).toBeVisible()
    
    // Check drag and drop area
    const dropZone = page.locator('[data-testid="drop-zone"]').or(page.locator('text=Drop your plugin here'))
    await expect(dropZone).toBeVisible()
    
    // Check file input
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()
  })

  test('should handle file upload', async ({ page }) => {
    await page.goto('/')
    
    // Create a test ZIP file
    const testZipPath = path.join(__dirname, 'fixtures', 'test-plugin.zip')
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('input[type="file"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testZipPath)
    
    // Check that upload starts
    await expect(page.locator('text=Uploading...')).toBeVisible()
  })

  test('should handle repository URL input', async ({ page }) => {
    await page.goto('/')
    
    // Fill repository URL
    const repoInput = page.locator('input[placeholder*="github.com"]')
    await repoInput.fill('https://github.com/test/repo.git')
    
    // Click scan button
    const scanButton = page.locator('button:has-text("Scan Repository")')
    await expect(scanButton).toBeEnabled()
    await scanButton.click()
    
    // Check that scan starts
    await expect(page.locator('text=Scanning...')).toBeVisible()
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/')
    
    // Try to scan with empty repository URL
    const scanButton = page.locator('button:has-text("Scan Repository")')
    await scanButton.click()
    
    // Check for error message
    await expect(page.locator('text=Please enter a repository URL')).toBeVisible()
  })

  test('should display scan progress', async ({ page }) => {
    await page.goto('/')
    
    // Mock a scan in progress
    await page.route('/api/scan/*/progress', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stage: 'Security Scanning',
            progress: 50,
            message: 'Scanning for vulnerabilities...'
          }
        })
      })
    })
    
    // Start a scan (this would normally be triggered by upload)
    await page.evaluate(() => {
      // Simulate scan start
      window.dispatchEvent(new CustomEvent('scanStart', { detail: { scanId: 'test-scan-id' } }))
    })
    
    // Check progress elements
    await expect(page.locator('text=Security Scan in Progress')).toBeVisible()
    await expect(page.locator('text=Scanning for vulnerabilities...')).toBeVisible()
  })
})

test.describe('Scan Results Display', () => {
  test('should display scan results correctly', async ({ page }) => {
    await page.goto('/')
    
    // Mock scan results
    const mockResults = {
      id: 'test-scan-id',
      pluginName: 'Test Plugin',
      pluginVersion: '1.0.0',
      scanDate: new Date().toISOString(),
      totalIssues: 5,
      criticalIssues: 1,
      highIssues: 2,
      mediumIssues: 1,
      lowIssues: 1,
      infoIssues: 0,
      issues: [
        {
          id: 'issue-1',
          title: 'SQL Injection Vulnerability',
          description: 'Potential SQL injection detected',
          severity: 'critical',
          category: 'SQL Injection',
          file: 'src/database.js',
          line: 15,
          code: "query('SELECT * FROM users WHERE id = ' + userId)",
          suggestedFix: 'Use parameterized queries',
          cwe: 'CWE-89',
          confidence: 'high'
        }
      ],
      scanDuration: 5000,
      status: 'completed'
    }
    
    await page.route('/api/scan/*/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockResults
        })
      })
    })
    
    // Simulate showing results
    await page.evaluate((results) => {
      window.dispatchEvent(new CustomEvent('showResults', { detail: results }))
    }, mockResults)
    
    // Check results are displayed
    await expect(page.locator('text=Scan Results')).toBeVisible()
    await expect(page.locator('text=Test Plugin')).toBeVisible()
    await expect(page.locator('text=SQL Injection Vulnerability')).toBeVisible()
  })

  test('should filter issues by severity', async ({ page }) => {
    await page.goto('/')
    
    // Mock results with different severities
    const mockResults = {
      id: 'test-scan-id',
      pluginName: 'Test Plugin',
      totalIssues: 3,
      criticalIssues: 1,
      highIssues: 1,
      mediumIssues: 1,
      lowIssues: 0,
      infoIssues: 0,
      issues: [
        { id: '1', title: 'Critical Issue', severity: 'critical', category: 'Test' },
        { id: '2', title: 'High Issue', severity: 'high', category: 'Test' },
        { id: '3', title: 'Medium Issue', severity: 'medium', category: 'Test' }
      ],
      scanDuration: 1000,
      status: 'completed'
    }
    
    await page.evaluate((results) => {
      window.dispatchEvent(new CustomEvent('showResults', { detail: results }))
    }, mockResults)
    
    // Click on critical severity filter
    await page.locator('text=Critical').click()
    
    // Check only critical issues are shown
    await expect(page.locator('text=Critical Issue')).toBeVisible()
    await expect(page.locator('text=High Issue')).not.toBeVisible()
    await expect(page.locator('text=Medium Issue')).not.toBeVisible()
  })

  test('should expand and show issue details', async ({ page }) => {
    await page.goto('/')
    
    const mockResults = {
      id: 'test-scan-id',
      pluginName: 'Test Plugin',
      totalIssues: 1,
      criticalIssues: 1,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      infoIssues: 0,
      issues: [
        {
          id: 'issue-1',
          title: 'Test Issue',
          description: 'Test description',
          severity: 'critical',
          category: 'Test',
          file: 'test.js',
          line: 1,
          code: 'console.log("test")',
          suggestedFix: 'Fix this issue',
          cwe: 'CWE-123'
        }
      ],
      scanDuration: 1000,
      status: 'completed'
    }
    
    await page.evaluate((results) => {
      window.dispatchEvent(new CustomEvent('showResults', { detail: results }))
    }, mockResults)
    
    // Click on issue to expand
    await page.locator('text=Test Issue').click()
    
    // Check details are shown
    await expect(page.locator('text=Code:')).toBeVisible()
    await expect(page.locator('text=Suggested Fix:')).toBeVisible()
    await expect(page.locator('text=console.log("test")')).toBeVisible()
  })
})

test.describe('Scan History', () => {
  test('should display scan history', async ({ page }) => {
    await page.goto('/')
    
    // Mock history data
    const mockHistory = [
      {
        id: 'scan-1',
        pluginName: 'Plugin 1',
        scanDate: new Date().toISOString(),
        totalIssues: 3,
        criticalIssues: 1,
        highIssues: 1,
        mediumIssues: 1,
        lowIssues: 0,
        infoIssues: 0,
        scanDuration: 2000,
        status: 'completed'
      },
      {
        id: 'scan-2',
        pluginName: 'Plugin 2',
        scanDate: new Date(Date.now() - 86400000).toISOString(),
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        infoIssues: 0,
        scanDuration: 1500,
        status: 'completed'
      }
    ]
    
    await page.route('/api/scans/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory
        })
      })
    })
    
    // Click history button
    await page.locator('text=History').click()
    
    // Check history is displayed
    await expect(page.locator('text=Scan History')).toBeVisible()
    await expect(page.locator('text=Plugin 1')).toBeVisible()
    await expect(page.locator('text=Plugin 2')).toBeVisible()
  })

  test('should allow selecting previous scans', async ({ page }) => {
    await page.goto('/')
    
    const mockHistory = [
      {
        id: 'scan-1',
        pluginName: 'Previous Plugin',
        scanDate: new Date().toISOString(),
        totalIssues: 2,
        criticalIssues: 1,
        highIssues: 1,
        mediumIssues: 0,
        lowIssues: 0,
        infoIssues: 0,
        scanDuration: 1000,
        status: 'completed',
        issues: [
          {
            id: 'issue-1',
            title: 'Previous Issue',
            severity: 'critical',
            category: 'Test'
          }
        ]
      }
    ]
    
    await page.route('/api/scans/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory
        })
      })
    })
    
    await page.route('/api/scan/scan-1/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory[0]
        })
      })
    })
    
    // Open history
    await page.locator('text=History').click()
    
    // Click on a previous scan
    await page.locator('text=Previous Plugin').click()
    
    // Check results are shown
    await expect(page.locator('text=Scan Results')).toBeVisible()
    await expect(page.locator('text=Previous Plugin')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check main elements are visible on mobile
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=Upload Plugin')).toBeVisible()
    await expect(page.locator('text=Git Repository')).toBeVisible()
  })

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Check layout adapts to tablet
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=Upload Plugin')).toBeVisible()
  })
})
