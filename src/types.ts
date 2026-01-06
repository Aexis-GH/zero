export type Platform = 'macos' | 'linux' | 'windows';
export type ShellFlavor = 'posix' | 'powershell';

export type FrameworkId = 'nextjs' | 'expo';
export type ModuleId = 'neon' | 'clerk' | 'payload' | 'stripe';
export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn';

export interface ProjectConfig {
  directory: string;
  appName: string;
  domain: string;
  framework: FrameworkId;
  modules: ModuleId[];
  packageManager: PackageManager;
}
