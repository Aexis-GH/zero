import type { FrameworkId, ModuleId } from '../types.js';

export interface ModuleEnvVar {
  key: string;
  description: string;
  url?: string;
  frameworks?: FrameworkId[];
}

export interface ModuleConnection {
  label: string;
  url: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  connect?: ModuleConnection;
  envVars: ModuleEnvVar[];
  packages: Record<FrameworkId, string[]>;
}

export const modules: ModuleDefinition[] = [
  {
    id: 'neon',
    label: 'DB',
    description: 'Serverless Postgres via Neon.',
    connect: {
      label: 'Connect to Neon',
      url: 'https://console.neon.tech/'
    },
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
    label: 'Auth',
    description: 'Authentication via Clerk.',
    connect: {
      label: 'Connect to Clerk',
      url: 'https://dashboard.clerk.com'
    },
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
    label: 'CMS',
    description: 'Headless CMS via Payload.',
    connect: {
      label: 'Generate Payload Secret',
      url: 'https://payloadcms.com/docs'
    },
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
    label: 'Payments',
    description: 'Payments via Stripe.',
    connect: {
      label: 'Connect to Stripe',
      url: 'https://dashboard.stripe.com/apikeys'
    },
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
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Contact form email via Resend.',
    connect: {
      label: 'Connect to Resend',
      url: 'https://resend.com/api-keys'
    },
    envVars: [
      {
        key: 'RESEND_API_KEY',
        description: 'Resend API key',
        url: 'https://resend.com/api-keys',
        frameworks: ['nextjs']
      },
      {
        key: 'CONTACT_FROM_EMAIL',
        description: 'Verified sender email address',
        url: 'https://resend.com/domains',
        frameworks: ['nextjs']
      },
      {
        key: 'CONTACT_TO_EMAIL',
        description: 'Destination email address',
        frameworks: ['nextjs']
      },
      {
        key: 'EXPO_PUBLIC_CONTACT_ENDPOINT',
        description: 'Contact API endpoint (e.g. https://yourdomain.com/api/contact)',
        frameworks: ['expo']
      }
    ],
    packages: {
      nextjs: ['resend'],
      expo: []
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

export function getModuleEnvVars(moduleIds: ModuleId[], framework: FrameworkId): string[] {
  const envVars = new Set<string>();
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    for (const envVar of module.envVars) {
      if (!supportsFramework(envVar, framework)) {
        continue;
      }
      envVars.add(envVar.key);
    }
  }
  return Array.from(envVars).sort();
}

export function getModuleEnvHelp(moduleIds: ModuleId[], framework: FrameworkId): ModuleEnvVar[] {
  const map = new Map<string, ModuleEnvVar>();
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    for (const envVar of module.envVars) {
      if (!supportsFramework(envVar, framework)) {
        continue;
      }
      if (!map.has(envVar.key)) {
        map.set(envVar.key, envVar);
      }
    }
  }
  return Array.from(map.values());
}

export function getModuleConnections(moduleIds: ModuleId[]): ModuleConnection[] {
  const connections: ModuleConnection[] = [];
  for (const id of moduleIds) {
    const module = getModuleDefinition(id);
    if (module.connect) {
      connections.push(module.connect);
      continue;
    }
    const fallback = module.envVars.find((item) => item.url);
    if (fallback?.url) {
      connections.push({
        label: `Connect to ${module.label}`,
        url: fallback.url
      });
    }
  }
  return connections;
}

function supportsFramework(envVar: ModuleEnvVar, framework: FrameworkId): boolean {
  if (!envVar.frameworks || envVar.frameworks.length === 0) {
    return true;
  }
  return envVar.frameworks.includes(framework);
}
