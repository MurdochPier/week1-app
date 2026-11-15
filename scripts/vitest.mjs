// Runs Vitest with a normalized (uppercase) Windows drive letter.
// VS Code can start terminals in "c:\..." while Node resolves modules as "C:\...",
// which makes Vitest load twice and fail with "failed to find the current suite".
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const fixDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase())

const cwd = fixDrive(process.cwd())
const bin = path.join(cwd, 'node_modules', 'vitest', 'vitest.mjs')

const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
