import path from 'path';
import { promises as fs } from 'fs';
import type { FrameworkId, ModuleId } from '../types.js';
import { getBaseEnvVars } from '../config/base-env.js';
import { getModuleEnvVars } from '../config/modules.js';

export async function writeEnvExample(
  moduleIds: ModuleId[],
  framework: FrameworkId,
  targetDir: string
): Promise<void> {
  const envVars = [...getBaseEnvVars(framework), ...getModuleEnvVars(moduleIds)];
  const unique = Array.from(new Set(envVars));
  const lines = unique.map((key) => `${key}=`);
  const content = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  const envPath = path.join(targetDir, '.env.example');
  await fs.writeFile(envPath, content, 'utf8');
}
