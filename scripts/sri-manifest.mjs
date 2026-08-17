// Creates and verifies immutable, versioned browser assets and their SRI manifest.
// Uses only Node builtins so the same guard runs locally, in Pages, and in CI.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(repoRoot, 'dist')
const pkg = readJson(join(repoRoot, 'package.json'))
const releases = readJson(join(repoRoot, 'release-integrity.json'))
const version = pkg.version

const targets = [
  { kind: 'js', stable: 'acrux-chat.iife.js', versioned: `acrux-chat.v${version}.iife.js` },
  { kind: 'css', stable: 'style.css', versioned: `style.v${version}.css` },
]

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function sriHash(bytes) {
  return `sha384-${createHash('sha384').update(bytes).digest('base64')}`
}

function fail(message) {
  throw new Error(`Release integrity check failed: ${message}`)
}

function assertEqual(actual, expected, description) {
  if (actual !== expected) fail(`${description}: expected ${expected}, got ${actual}`)
}

const expected = releases[version]
if (!expected) {
  fail(`version ${version} is not recorded in release-integrity.json`)
}

const stableBytes = new Map()
for (const target of targets) {
  const bytes = readFileSync(join(distDir, target.stable))
  const integrity = sriHash(bytes)
  assertEqual(integrity, expected[target.kind], `${target.stable} SHA-384`)
  stableBytes.set(target.kind, bytes)

  // Check before writing: a recorded version must never be silently replaced.
  const versionedPath = join(distDir, target.versioned)
  if (existsSync(versionedPath)) {
    assertEqual(sriHash(readFileSync(versionedPath)), expected[target.kind], `${target.versioned} SHA-384`)
  }
}

function verifyRelease() {
  const manifest = readJson(join(distDir, 'sri-manifest.json'))
  assertEqual(manifest.version, version, 'manifest version')

  for (const [recordedVersion, recordedIntegrity] of Object.entries(releases)) {
    const recordedTargets = [
      { kind: 'js', versioned: `acrux-chat.v${recordedVersion}.iife.js` },
      { kind: 'css', versioned: `style.v${recordedVersion}.css` },
    ]

    for (const target of recordedTargets) {
      const path = join(distDir, target.versioned)
      if (!existsSync(path)) fail(`${target.versioned} is missing`)
      assertEqual(
        sriHash(readFileSync(path)),
        recordedIntegrity[target.kind],
        `${target.versioned} SHA-384`,
      )
    }
  }

  for (const target of targets) {
    assertEqual(manifest[target.kind]?.file, target.versioned, `manifest ${target.kind} filename`)
    assertEqual(manifest[target.kind]?.integrity, expected[target.kind], `manifest ${target.kind} SHA-384`)

    const versionedBytes = readFileSync(join(distDir, target.versioned))
    assertEqual(sriHash(versionedBytes), expected[target.kind], `${target.versioned} SHA-384`)
    if (!versionedBytes.equals(stableBytes.get(target.kind))) {
      fail(`${target.stable} and ${target.versioned} differ`)
    }
  }

  console.log(`Verified release integrity for v${version}`)
}

if (process.argv.includes('--verify')) {
  verifyRelease()
} else {
  const manifest = { version }
  for (const target of targets) {
    writeFileSync(join(distDir, target.versioned), stableBytes.get(target.kind))
    manifest[target.kind] = { file: target.versioned, integrity: expected[target.kind] }
  }
  writeFileSync(join(distDir, 'sri-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  verifyRelease()
  console.log(`Generated release assets for v${version}`)
}
