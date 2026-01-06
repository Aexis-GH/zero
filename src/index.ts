#!/usr/bin/env node
import { runWizard } from './cli/prompts.js';
import { assertBunAvailable } from './env/detect.js';
import { scaffoldProject } from './engine/scaffold.js';
import type { ProjectConfig } from './types.js';

async function main(): Promise<void> {
  try {
    await assertBunAvailable();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return;
  }

  const config: ProjectConfig | null = await runWizard();
  if (!config) {
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
