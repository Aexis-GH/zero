import type { FrameworkId, ModuleId } from '../types.js';

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  envVars: string[];
  packages: Record<FrameworkId, string[]>;
}

export const modules: ModuleDefinition[] = [
  {
    id: 'neon',
    label: 'Database (Neon)',
    description: 'Serverless Postgres with Neon.',
    envVars: ['DATABASE_URL'],
    packages: {
      nextjs: ['@neondatabase/serverless'],
      expo: ['@neondatabase/serverless']
    }
  },
  {
    id: 'clerk',
    label: 'Auth (Clerk)',
    description: 'Authentication with Clerk.',
    envVars: ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    packages: {
      nextjs: ['@clerk/nextjs'],
      expo: ['@clerk/clerk-expo']
    }
  },
  {
    id: 'payload',
    label: 'CMS (Payload)',
    description: 'Headless CMS using Payload.',
    envVars: ['PAYLOAD_SECRET', 'DATABASE_URL'],
    packages: {
      nextjs: ['payload'],
      expo: ['payload']
    }
  },
  {
    id: 'stripe',
    label: 'Payments (Stripe)',
    description: 'Payments via Stripe SDK.',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    packages: {
      nextjs: ['stripe'],
      expo: ['stripe']
    }
  }
];

export function getModuleDefinition(id: ModuleId): ModuleDefinition {
  const module = modules.find((item) => item.id === id);
  if (!module) {
    throw new Error(`Unknown module: ${id}`);
  }
  return module;
}

export function getModulePackages(moduleIds: ModuleId[], framework: FrameworkId): string[] {
  const packages = new Set<string>();
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    for (const pkg of module.packages[framework]) {
      packages.add(pkg);
    }
  }
  return Array.from(packages).sort();
}

export function getModuleEnvVars(moduleIds: ModuleId[]): string[] {
  const envVars = new Set<string>();
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    for (const envVar of module.envVars) {
      envVars.add(envVar);
    }
  }
  return Array.from(envVars).sort();
}
