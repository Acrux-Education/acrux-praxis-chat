// Post-build step for the IIFE bundle.
//
// Produces versioned immutable copies of the stable artifacts so consumers can
// pin a Subresource Integrity (SRI) hash, then writes a manifest whose integrity
// values are computed from the exact bytes that were just emitted.
//
// Uses ONLY Node builtins — no new dependencies.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(repoRoot, 'dist')

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
const version = pkg.version

const sriHash = (bytes) => 'sha384-' + createHash('sha384').update(bytes).digest('base64')

// [stable file, versioned file]
const targets = [
  { kind: 'js', stable: 'acrux-chat.iife.js', versioned: `acrux-chat.v${version}.iife.js` },
  { kind: 'css', stable: 'style.css', versioned: `style.v${version}.css` },
]

const manifest = { version }

for (const { kind, stable, versioned } of targets) {
  const bytes = readFileSync(join(distDir, stable))
  writeFileSync(join(distDir, versioned), bytes)
  manifest[kind] = { file: versioned, integrity: sriHash(bytes) }
}

writeFileSync(join(distDir, 'sri-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log('SRI manifest written:', JSON.stringify(manifest, null, 2))
