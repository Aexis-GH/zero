import { execa } from 'execa';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import type { ProjectConfig } from '../types.js';

export async function runWizard(): Promise<ProjectConfig | null> {
  const binPath = resolveTuiBinary();
  try {
    await fs.stat(binPath);
  } catch {
    throw new Error(`TUI binary not found. Expected ${binPath}. Reinstall the CLI or run npm run build:tui.`);
  }
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aexis-zero-'));
  const outputPath = path.join(tmpDir, 'result.json');

  try {
    await execa(binPath, ['-output', outputPath], {
      stdio: 'inherit',
      shell: false
    });
  } catch (error) {
    return null;
  }

  try {
    const content = await fs.readFile(outputPath, 'utf8');
    if (!content.trim()) {
      return null;
    }
    return JSON.parse(content) as ProjectConfig;
  } catch {
    return null;
  }
}

function resolveTuiBinary(): string {
  const platform = process.platform;
  const arch = process.arch;

  let target = '';
  if (platform === 'darwin') {
    target = arch === 'arm64' ? 'darwin-arm64' : 'darwin-amd64';
  } else if (platform === 'linux') {
    target = arch === 'arm64' ? 'linux-arm64' : 'linux-amd64';
  } else if (platform === 'win32') {
    target = 'windows-amd64';
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const exe = platform === 'win32' ? '.exe' : '';
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const binDir = path.resolve(currentDir, '..', '..', 'bin');
  const binPath = path.join(binDir, `zero-${target}${exe}`);

  return binPath;
}
