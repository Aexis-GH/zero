#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
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

  let config: ProjectConfig | null = null;
  const { waitUntilExit } = render(
    <App
      onComplete={(result) => {
        config = result;
      }}
    />
  );

  await waitUntilExit();

  if (!config) {
    console.log('Cancelled.');
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
