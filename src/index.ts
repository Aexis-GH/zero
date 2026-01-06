#!/usr/bin/env node
import { runWizard } from './cli/bubbletea.js';
import { assertPackageManagerAvailable } from './env/detect.js';
import { scaffoldProject } from './engine/scaffold.js';
import type { ProjectConfig } from './types.js';

async function main(): Promise<void> {
  const config: ProjectConfig | null = await runWizard();
  if (!config) {
    return;
  }

  try {
    await assertPackageManagerAvailable(config.packageManager);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return;
  }

  try {
    await scaffoldProject(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
