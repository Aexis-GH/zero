import type { FrameworkId } from '../types.js';
import type { ModuleEnvVar } from './modules.js';

const nextBaseEnv: ModuleEnvVar[] = [
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API key',
    url: 'https://resend.com'
  },
  {
    key: 'EMAIL_FROM',
    description: 'Verified sender email address'
  },
  {
    key: 'EMAIL_TO',
    description: 'Destination email address'
  }
];

const expoBaseEnv: ModuleEnvVar[] = [
  {
    key: 'EXPO_PUBLIC_CONTACT_EMAIL',
    description: 'Email address used for contact form'
  },
  {
    key: 'EXPO_PUBLIC_CONTACT_ENDPOINT',
    description: 'Optional contact API endpoint'
  }
];

export function getBaseEnvHelp(framework: FrameworkId): ModuleEnvVar[] {
  return framework === 'nextjs' ? nextBaseEnv : expoBaseEnv;
}

export function getBaseEnvVars(framework: FrameworkId): string[] {
  return getBaseEnvHelp(framework).map((item) => item.key);
}
