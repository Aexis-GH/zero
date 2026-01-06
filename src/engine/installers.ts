import { execa } from 'execa';
import type { FrameworkId, ModuleId } from '../types.js';
import { getModulePackages } from '../config/modules.js';

const baseEnv = {
  ...process.env,
  CI: '1'
};

export async function installBaseDependencies(targetDir: string, extraPackages: string[] = []): Promise<void> {
  if (extraPackages.length > 0) {
    const packages = Array.from(new Set(extraPackages)).sort();
    await execa('bun', ['add', ...packages], {
      cwd: targetDir,
      stdio: 'inherit',
      env: baseEnv,
      shell: false
    });
    return;
  }
  await execa('bun', ['install'], {
    cwd: targetDir,
    stdio: 'inherit',
    env: baseEnv,
    shell: false
  });
}

export async function installModulePackages(
  framework: FrameworkId,
  moduleIds: ModuleId[],
  targetDir: string
): Promise<void> {
  const packages = getModulePackages(moduleIds, framework);
  if (packages.length === 0) {
    return;
  }
  await execa('bun', ['add', ...packages], {
    cwd: targetDir,
    stdio: 'inherit',
    env: baseEnv,
    shell: false
  });
}
