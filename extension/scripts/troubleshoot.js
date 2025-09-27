#!/usr/bin/env node

/**
 * L1xi Extension Troubleshooting Script
 * Run this script to check for common issues
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 L1xi Extension Troubleshooting\n')

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json')
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: Run this script from the extension directory')
    process.exit(1)
}

console.log('✅ Running from extension directory')

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules')
if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ node_modules not found. Run: npm install')
    process.exit(1)
}

console.log('✅ node_modules found')

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist')
if (!fs.existsSync(distPath)) {
    console.warn('⚠️  dist directory not found. Run: npm run build')
} else {
    console.log('✅ dist directory found')

    // Check if manifest.json exists in dist
    const manifestPath = path.join(distPath, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
        console.warn('⚠️  manifest.json not found in dist. Run: npm run build')
    } else {
        console.log('✅ manifest.json found in dist')
    }
}

// Check TypeScript configuration
const tsconfigPath = path.join(__dirname, 'tsconfig.json')
if (!fs.existsSync(tsconfigPath)) {
    console.error('❌ tsconfig.json not found')
} else {
    console.log('✅ tsconfig.json found')

    try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
        if (
            tsconfig.compilerOptions &&
            tsconfig.compilerOptions.paths &&
            tsconfig.compilerOptions.paths['@/*']
        ) {
            console.log('✅ @ path alias configured')
        } else {
            console.warn('⚠️  @ path alias not configured properly')
        }
    } catch (e) {
        console.error('❌ Error reading tsconfig.json:', e.message)
    }
}

// Check key source files
const keyFiles = [
    'src/components/Dashboard.tsx',
    'src/components/LoginForm.tsx',
    'src/components/RegisterForm.tsx',
    'src/services/authService.ts',
    'src/types/auth.ts',
    'src/utils/storage.ts',
    'src/config/index.ts'
]

let missingFiles = []
keyFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    if (!fs.existsSync(filePath)) {
        missingFiles.push(file)
    }
})

if (missingFiles.length > 0) {
    console.error('❌ Missing key files:')
    missingFiles.forEach(file => console.error(`   - ${file}`))
} else {
    console.log('✅ All key source files found')
}

// Check package.json scripts
try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const requiredScripts = ['dev', 'build', 'build:js']
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script])

    if (missingScripts.length > 0) {
        console.warn('⚠️  Missing package.json scripts:', missingScripts.join(', '))
    } else {
        console.log('✅ All required npm scripts found')
    }
} catch (e) {
    console.error('❌ Error reading package.json:', e.message)
}

console.log('\n🚀 Troubleshooting complete!')
console.log('\nNext steps:')
console.log('1. Run: npm run build')
console.log('2. Load extension in browser from dist/ folder')
console.log('3. Make sure L1xi backend is running on http://localhost:5000')
console.log('4. Check browser console for any runtime errors')

console.log('\nFor more help, see DEVELOPMENT.md')
