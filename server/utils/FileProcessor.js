const fs = require('fs').promises
const path = require('path')
const AdmZip = require('adm-zip')
const simpleGit = require('simple-git')

class FileProcessor {
  constructor() {
    this.git = simpleGit()
  }

  async extractArchive(filePath, originalName) {
    const extractDir = path.join(path.dirname(filePath), 'extracted', path.basename(filePath, path.extname(filePath)))
    await fs.mkdir(extractDir, { recursive: true })

    try {
      console.log(`📦 Extracting ZIP file: ${filePath}`)
      const zip = new AdmZip(filePath)
      const entries = zip.getEntries()
      
      console.log(`📁 Found ${entries.length} entries in ZIP file`)
      
      for (const entry of entries) {
        const entryPath = path.join(extractDir, entry.entryName)
        const entryDir = path.dirname(entryPath)
        
        // Create directory if it doesn't exist
        await fs.mkdir(entryDir, { recursive: true })
        
        if (!entry.isDirectory) {
          // Extract file
          const data = entry.getData()
          await fs.writeFile(entryPath, data)
          console.log(`📄 Extracted: ${entry.entryName}`)
        } else {
          console.log(`📁 Directory: ${entry.entryName}`)
        }
      }
      
      console.log(`✅ ZIP extraction completed successfully to: ${extractDir}`)
      return extractDir
    } catch (error) {
      console.error('❌ Error extracting ZIP file:', error)
      throw new Error(`Failed to extract ZIP file: ${error.message}`)
    }
  }

  async cloneRepository(repoUrl) {
    const cloneDir = path.join(__dirname, '..', 'repos', `repo_${Date.now()}`)
    await fs.mkdir(path.dirname(cloneDir), { recursive: true })

    try {
      await this.git.clone(repoUrl, cloneDir)
      return cloneDir
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`)
    }
  }

  async getPluginInfo(dirPath) {
    const info = {
      name: 'Unknown Plugin',
      version: undefined,
      description: undefined,
      author: undefined,
      license: undefined,
      dependencies: {},
      devDependencies: {},
      files: [],
      size: 0
    }

    try {
      // Try to read package.json (Node.js)
      const packageJsonPath = path.join(dirPath, 'package.json')
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
        info.name = packageJson.name || info.name
        info.version = packageJson.version
        info.description = packageJson.description
        info.author = packageJson.author
        info.license = packageJson.license
        info.dependencies = packageJson.dependencies || {}
        info.devDependencies = packageJson.devDependencies || {}
      } catch (e) {
        // Not a Node.js project, try other formats
      }

      // Try to read composer.json (PHP)
      const composerJsonPath = path.join(dirPath, 'composer.json')
      try {
        const composerJson = JSON.parse(await fs.readFile(composerJsonPath, 'utf8'))
        if (!info.name || info.name === 'Unknown Plugin') {
          info.name = composerJson.name || info.name
        }
        if (!info.version) {
          info.version = composerJson.version
        }
        if (!info.description) {
          info.description = composerJson.description
        }
        if (!info.author) {
          info.author = composerJson.authors?.[0]?.name
        }
        if (!info.license) {
          info.license = composerJson.license
        }
      } catch (e) {
        // Not a PHP project
      }

      // Try to read setup.py (Python)
      const setupPyPath = path.join(dirPath, 'setup.py')
      try {
        const setupPyContent = await fs.readFile(setupPyPath, 'utf8')
        const nameMatch = setupPyContent.match(/name\s*=\s*['"]([^'"]+)['"]/)
        const versionMatch = setupPyContent.match(/version\s*=\s*['"]([^'"]+)['"]/)
        
        if (nameMatch && (!info.name || info.name === 'Unknown Plugin')) {
          info.name = nameMatch[1]
        }
        if (versionMatch && !info.version) {
          info.version = versionMatch[1]
        }
      } catch (e) {
        // Not a Python project
      }

      // Get file list and calculate size
      info.files = await this.getAllFiles(dirPath)
      info.size = await this.calculateDirectorySize(dirPath)

      return info
    } catch (error) {
      console.error('Error getting plugin info:', error)
      return info
    }
  }

  async getAllFiles(dirPath) {
    const files = []
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Skip common directories
        if (['node_modules', '.git', '.svn', 'vendor', '__pycache__', '.pytest_cache', 'dist', 'build'].includes(entry.name)) {
          continue
        }
        const subFiles = await this.getAllFiles(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0
    
    try {
      const files = await this.getAllFiles(dirPath)
      
      for (const filePath of files) {
        try {
          const stats = await fs.stat(filePath)
          totalSize += stats.size
        } catch (e) {
          // Ignore files that can't be stat'd
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error)
    }

    return totalSize
  }

  async cleanup(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true })
    } catch (error) {
      console.error('Error cleaning up directory:', error)
    }
  }
}

module.exports = FileProcessor
