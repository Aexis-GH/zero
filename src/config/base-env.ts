import type { FrameworkId } from '../types.js';
import type { ModuleEnvVar } from './modules.js';

const nextBaseEnv: ModuleEnvVar[] = [];

const expoBaseEnv: ModuleEnvVar[] = [];

export function getBaseEnvHelp(framework: FrameworkId): ModuleEnvVar[] {
  return framework === 'nextjs' ? nextBaseEnv : expoBaseEnv;
}

export function getBaseEnvVars(framework: FrameworkId): string[] {
  return getBaseEnvHelp(framework).map((item) => item.key);
}
