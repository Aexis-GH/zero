import { execa } from 'execa';
import type { FrameworkId, ModuleId, PackageManager } from '../types.js';
import { getModulePackages } from '../config/modules.js';
import { getPackageManagerDefinition } from '../config/package-managers.js';

const baseEnv = {
  ...process.env,
  CI: '1'
};

export async function installBaseDependencies(
  targetDir: string,
  packageManager: PackageManager,
  extraPackages: string[] = []
): Promise<void> {
  const manager = getPackageManagerDefinition(packageManager);
  if (extraPackages.length > 0) {
    const packages = Array.from(new Set(extraPackages)).sort();
    await execa(manager.add[0], [...manager.add.slice(1), ...packages], {
      cwd: targetDir,
      stdio: 'inherit',
      env: baseEnv,
      shell: false
    });
    return;
  }
  await execa(manager.install[0], manager.install.slice(1), {
    cwd: targetDir,
    stdio: 'inherit',
    env: baseEnv,
    shell: false
  });
}

export async function installModulePackages(
  framework: FrameworkId,
  moduleIds: ModuleId[],
  targetDir: string,
  packageManager: PackageManager
): Promise<void> {
  const packages = getModulePackages(moduleIds, framework);
  if (packages.length === 0) {
    return;
  }
  const manager = getPackageManagerDefinition(packageManager);
  await execa(manager.add[0], [...manager.add.slice(1), ...packages], {
    cwd: targetDir,
    stdio: 'inherit',
    env: baseEnv,
    shell: false
  });
}
