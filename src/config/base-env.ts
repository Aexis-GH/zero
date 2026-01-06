import type { FrameworkId } from '../types.js';
import type { ModuleEnvVar } from './modules.js';

const nextBaseEnv: ModuleEnvVar[] = [
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API key',
    url: 'https://resend.com'
  },
  {
    key: 'CONTACT_FROM_EMAIL',
    description: 'Verified sender email address'
  },
  {
    key: 'CONTACT_TO_EMAIL',
    description: 'Destination email address'
  }
];

const expoBaseEnv: ModuleEnvVar[] = [
  {
    key: 'EXPO_PUBLIC_CONTACT_ENDPOINT',
    description: 'Contact API endpoint (e.g. https://yourdomain.com/api/contact)'
  }
];

export function getBaseEnvHelp(framework: FrameworkId): ModuleEnvVar[] {
  return framework === 'nextjs' ? nextBaseEnv : expoBaseEnv;
}

export function getBaseEnvVars(framework: FrameworkId): string[] {
  return getBaseEnvHelp(framework).map((item) => item.key);
}
