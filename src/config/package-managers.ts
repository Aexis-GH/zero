import type { PackageManager } from '../types.js';

export interface PackageRunner {
  command: string;
  args: string[];
}

export interface PackageManagerDefinition {
  id: PackageManager;
  label: string;
  runner: PackageRunner;
  install: string[];
  add: string[];
  dev: string[];
}

export const packageManagers: PackageManagerDefinition[] = [
  {
    id: 'npm',
    label: 'npm',
    runner: { command: 'npx', args: [] },
    install: ['npm', 'install'],
    add: ['npm', 'install'],
    dev: ['npm', 'run', 'dev']
  },
  {
    id: 'pnpm',
    label: 'pnpm',
    runner: { command: 'pnpm', args: ['dlx'] },
    install: ['pnpm', 'install'],
    add: ['pnpm', 'add'],
    dev: ['pnpm', 'dev']
  },
  {
    id: 'yarn',
    label: 'yarn',
    runner: { command: 'yarn', args: ['dlx'] },
    install: ['yarn', 'install'],
    add: ['yarn', 'add'],
    dev: ['yarn', 'dev']
  },
  {
    id: 'bun',
    label: 'bun',
    runner: { command: 'bunx', args: [] },
    install: ['bun', 'install'],
    add: ['bun', 'add'],
    dev: ['bun', 'run', 'dev']
  }
];

export function getPackageManagerDefinition(id: PackageManager): PackageManagerDefinition {
  const manager = packageManagers.find((item) => item.id === id);
  if (!manager) {
    throw new Error(`Unknown package manager: ${id}`);
  }
  return manager;
}
