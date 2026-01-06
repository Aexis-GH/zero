import which from 'which';
import type { Platform, ShellFlavor } from '../types.js';

export function detectPlatform(): Platform {
  switch (process.platform) {
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'linux';
  }
}

export function detectShell(platform: Platform = detectPlatform()): ShellFlavor {
  return platform === 'windows' ? 'powershell' : 'posix';
}

export async function isBunAvailable(): Promise<boolean> {
  try {
    await which('bun');
    return true;
  } catch {
    return false;
  }
}

export async function assertBunAvailable(): Promise<void> {
  const available = await isBunAvailable();
  if (!available) {
    const platform = detectPlatform();
    const shell = detectShell(platform);
    const hint = platform === 'windows'
      ? 'Install Bun for Windows and reopen PowerShell.'
      : 'Install Bun and ensure it is on your PATH.';
    throw new Error(`Bun is required but was not found in PATH. (${platform}/${shell}) ${hint}`);
  }
}
