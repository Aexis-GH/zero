import type { FrameworkId, ModuleId } from '../types.js';

export interface ModuleEnvVar {
  key: string;
  description: string;
  url?: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  envVars: ModuleEnvVar[];
  packages: Record<FrameworkId, string[]>;
}

export const modules: ModuleDefinition[] = [
  {
    id: 'neon',
    label: 'Database (Neon)',
    description: 'Serverless Postgres with Neon.',
    envVars: [
      {
        key: 'DATABASE_URL',
        description: 'Neon connection string',
        url: 'https://neon.com/docs/get-started/connect-neon'
      }
    ],
    packages: {
      nextjs: ['@neondatabase/serverless'],
      expo: ['@neondatabase/serverless']
    }
  },
  {
    id: 'clerk',
    label: 'Auth (Clerk)',
    description: 'Authentication with Clerk.',
    envVars: [
      {
        key: 'CLERK_PUBLISHABLE_KEY',
        description: 'Clerk publishable key',
        url: 'https://dashboard.clerk.com'
      },
      {
        key: 'CLERK_SECRET_KEY',
        description: 'Clerk secret key',
        url: 'https://dashboard.clerk.com'
      }
    ],
    packages: {
      nextjs: ['@clerk/nextjs'],
      expo: ['@clerk/clerk-expo']
    }
  },
  {
    id: 'payload',
    label: 'CMS (Payload)',
    description: 'Headless CMS using Payload.',
    envVars: [
      {
        key: 'PAYLOAD_SECRET',
        description: 'Payload secret (generate a long random string)',
        url: 'https://payloadcms.com/docs'
      },
      {
        key: 'DATABASE_URL',
        description: 'Database connection string',
        url: 'https://payloadcms.com/docs'
      }
    ],
    packages: {
      nextjs: ['payload'],
      expo: ['payload']
    }
  },
  {
    id: 'stripe',
    label: 'Payments (Stripe)',
    description: 'Payments via Stripe SDK.',
    envVars: [
      {
        key: 'STRIPE_SECRET_KEY',
        description: 'Stripe secret key',
        url: 'https://dashboard.stripe.com/apikeys'
      },
      {
        key: 'STRIPE_WEBHOOK_SECRET',
        description: 'Stripe webhook signing secret',
        url: 'https://dashboard.stripe.com/webhooks'
      }
    ],
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
      envVars.add(envVar.key);
    }
  }
  return Array.from(envVars).sort();
}

export function getModuleEnvHelp(moduleIds: ModuleId[]): ModuleEnvVar[] {
  const map = new Map<string, ModuleEnvVar>();
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    for (const envVar of module.envVars) {
      if (!map.has(envVar.key)) {
        map.set(envVar.key, envVar);
      }
    }
  }
  return Array.from(map.values());
}
