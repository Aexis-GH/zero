import which from 'which';
import type { PackageManager, Platform, ShellFlavor } from '../types.js';
import { getPackageManagerDefinition } from '../config/package-managers.js';

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

export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await which(command);
    return true;
  } catch {
    return false;
  }
}

export async function assertPackageManagerAvailable(packageManager: PackageManager): Promise<void> {
  const manager = getPackageManagerDefinition(packageManager);
  const command = manager.install[0];
  const available = await isCommandAvailable(command);
  if (!available) {
    const platform = detectPlatform();
    const shell = detectShell(platform);
    throw new Error(
      `${manager.label} is required but was not found in PATH. (${platform}/${shell}) Install ${manager.label} and retry.`
    );
  }
}
