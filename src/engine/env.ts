import path from 'path';
import { promises as fs } from 'fs';
import type { ModuleId } from '../types.js';
import { getModuleEnvVars } from '../config/modules.js';

export async function writeEnvExample(moduleIds: ModuleId[], targetDir: string): Promise<void> {
  const envVars = getModuleEnvVars(moduleIds);
  const lines = envVars.map((key) => `${key}=`);
  const content = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  const envPath = path.join(targetDir, '.env.example');
  await fs.writeFile(envPath, content, 'utf8');
}
