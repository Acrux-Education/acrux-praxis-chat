import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

test('verification rejects corruption in a prior recorded release', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'acrux-chat-integrity-'))

  try {
    mkdirSync(join(fixture, 'scripts'))
    mkdirSync(join(fixture, 'dist'))
    for (const file of ['package.json', 'release-integrity.json']) {
      cpSync(join(repoRoot, file), join(fixture, file))
    }
    cpSync(join(repoRoot, 'scripts', 'sri-manifest.mjs'), join(fixture, 'scripts', 'sri-manifest.mjs'))
    for (const file of [
      'acrux-chat.iife.js',
      'acrux-chat.v0.1.7.iife.js',
      'acrux-chat.v0.1.8.iife.js',
      'style.css',
      'style.v0.1.7.css',
      'style.v0.1.8.css',
      'sri-manifest.json',
    ]) {
      cpSync(join(repoRoot, 'dist', file), join(fixture, 'dist', file))
    }

    const priorJs = join(fixture, 'dist', 'acrux-chat.v0.1.7.iife.js')
    writeFileSync(priorJs, Buffer.concat([readFileSync(priorJs), Buffer.from('\ncorrupted\n')]))

    const result = spawnSync(process.execPath, [join(fixture, 'scripts', 'sri-manifest.mjs'), '--verify'], {
      encoding: 'utf8',
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /acrux-chat\.v0\.1\.7\.iife\.js SHA-384/)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
