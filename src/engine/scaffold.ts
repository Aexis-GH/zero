import path from 'path';
import { promises as fs } from 'fs';
import { execa } from 'execa';
import type { ProjectConfig } from '../types.js';
import { getFrameworkDefinition } from '../config/frameworks.js';
import { getBaseEnvHelp } from '../config/base-env.js';
import { getModuleEnvHelp, type ModuleEnvVar } from '../config/modules.js';
import { installBaseDependencies, installModulePackages } from './installers.js';
import { writeEnvExample } from './env.js';
import { assertAssetSources, generateExpoAssets, generateNextAssets, resolveAssetSources } from './assets.js';
import {
  buildNextTemplateFiles,
  buildExpoTemplateFiles,
  componentsJsonTemplate
} from './templates.js';

const baseEnv = {
  ...process.env,
  CI: '1'
};

export async function scaffoldProject(config: ProjectConfig): Promise<void> {
  const directoryInput = config.directory.trim().length === 0 ? '.' : config.directory.trim();
  const targetDir = path.resolve(process.cwd(), directoryInput);
  await ensureEmptyTargetDir(targetDir);

  const framework = getFrameworkDefinition(config.framework);
  const sources = resolveAssetSources();
  await assertAssetSources(sources);

  console.log(`Scaffolding ${framework.label}...`);
  await runScaffoldCommand(
    framework.scaffold.command,
    framework.scaffold.packageName,
    directoryInput,
    framework.scaffold.argSets
  );

  console.log('Applying framework templates...');
  if (config.framework === 'nextjs') {
    await applyNextTemplates(config, targetDir);
  } else {
    await applyExpoTemplates(config, targetDir);
  }

  console.log('Generating brand assets...');
  if (config.framework === 'nextjs') {
    const usesSrcDir = await pathExists(path.join(targetDir, 'src', 'app'));
    const appDir = usesSrcDir ? path.join(targetDir, 'src', 'app') : path.join(targetDir, 'app');
    await generateNextAssets(sources, {
      appDir,
      publicDir: path.join(targetDir, 'public'),
      assetsDir: path.join(targetDir, 'assets')
    });
  } else {
    await generateExpoAssets(sources, {
      appDir: path.join(targetDir, 'app'),
      publicDir: path.join(targetDir, 'public'),
      assetsDir: path.join(targetDir, 'assets')
    });
  }

  console.log('Installing base dependencies with Bun...');
  await installBaseDependencies(targetDir, framework.packages);

  console.log('Installing module packages...');
  await installModulePackages(config.framework, config.modules, targetDir);

  console.log('Generating .env.example...');
  await writeEnvExample(config.modules, config.framework, targetDir);

  console.log('Scaffold complete.');
  const cdTarget = directoryInput === '.' ? '.' : directoryInput.includes(' ') ? `"${directoryInput}"` : directoryInput;
  console.log(`\nNext steps:\n  1) cd ${cdTarget}\n  2) bun run dev`);
}

async function ensureEmptyTargetDir(targetDir: string): Promise<void> {
  try {
    const stat = await fs.stat(targetDir);
    if (!stat.isDirectory()) {
      throw new Error('Target path exists and is not a directory.');
    }
    const entries = await fs.readdir(targetDir);
    const allowed = new Set(['.git', '.gitignore', '.gitkeep']);
    const remaining = entries.filter((entry) => !allowed.has(entry));
    if (remaining.length > 0) {
      throw new Error('Target directory is not empty.');
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function runScaffoldCommand(
  command: string,
  packageName: string,
  directoryInput: string,
  argSets: string[][]
): Promise<void> {
  const errors: string[] = [];
  const targetArg = directoryInput === '.' ? '.' : directoryInput;
  for (const args of argSets) {
    try {
      await execa(command, [packageName, targetArg, ...args], {
        stdio: 'inherit',
        env: baseEnv,
        shell: false
      });
      return;
    } catch (error) {
      errors.push(formatError(error));
    }
  }
  const message = errors.length > 0
    ? `Scaffold failed after ${errors.length} attempts:\n${errors.join('\n')}`
    : 'Scaffold failed for unknown reasons.';
  throw new Error(message);
}

async function applyNextTemplates(config: ProjectConfig, targetDir: string): Promise<void> {
  const srcAppDir = path.join(targetDir, 'src', 'app');
  const usesSrcDir = await pathExists(srcAppDir);
  const basePath = usesSrcDir ? 'src' : '';
  const envHelp = mergeEnvHelp(getBaseEnvHelp(config.framework), getModuleEnvHelp(config.modules));

  const files = buildNextTemplateFiles({
    appName: config.appName,
    domain: config.domain,
    envVars: envHelp,
    basePath
  });

  await writeTemplateFiles(targetDir, files);

  const globalsPath = usesSrcDir ? 'src/app/globals.css' : 'app/globals.css';
  const tailwindConfig = await detectTailwindConfig(targetDir);
  const componentsJson = componentsJsonTemplate(globalsPath, tailwindConfig ?? 'tailwind.config.ts');
  await fs.writeFile(path.join(targetDir, 'components.json'), componentsJson, 'utf8');

  await ensureNextTurbo(targetDir);
  await ensurePackageName(targetDir, config.appName);
}

async function applyExpoTemplates(config: ProjectConfig, targetDir: string): Promise<void> {
  const envHelp = mergeEnvHelp(getBaseEnvHelp(config.framework), getModuleEnvHelp(config.modules));
  const files = buildExpoTemplateFiles({
    appName: config.appName,
    domain: config.domain,
    envVars: envHelp,
    basePath: ''
  });

  await writeTemplateFiles(targetDir, files);
  await ensureExpoConfig(targetDir, config.appName);
  await ensurePackageName(targetDir, config.appName);
}

async function ensureExpoConfig(targetDir: string, appName: string): Promise<void> {
  const appJsonPath = path.join(targetDir, 'app.json');
  const appJson = await readJson<Record<string, any>>(appJsonPath, { expo: {} });
  if (!appJson.expo || typeof appJson.expo !== 'object') {
    appJson.expo = {};
  }

  appJson.expo.name = appName;
  appJson.expo.slug = toSlug(appName);
  appJson.expo.icon = './assets/icon.png';
  appJson.expo.splash = {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#E7E5E4'
  };

  if (!Array.isArray(appJson.expo.platforms)) {
    appJson.expo.platforms = ['ios', 'android', 'macos', 'windows'];
  } else {
    const current = appJson.expo.platforms.filter((value: unknown) => typeof value === 'string');
    appJson.expo.platforms = mergeUnique(current, ['ios', 'android', 'macos', 'windows']);
  }

  if (!Array.isArray(appJson.expo.plugins)) {
    appJson.expo.plugins = ['expo-router'];
  } else {
    const current = appJson.expo.plugins.filter((value: unknown) => typeof value === 'string');
    appJson.expo.plugins = mergeUnique(current, ['expo-router']);
  }

  if (!appJson.expo.android || typeof appJson.expo.android !== 'object') {
    appJson.expo.android = {};
  }
  appJson.expo.android.adaptiveIcon = {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: '#E7E5E4'
  };

  if (!appJson.expo.ios || typeof appJson.expo.ios !== 'object') {
    appJson.expo.ios = {};
  }
  appJson.expo.ios.icon = './assets/icon.png';

  if (!appJson.expo.web || typeof appJson.expo.web !== 'object') {
    appJson.expo.web = {};
  }
  appJson.expo.web.favicon = './assets/favicon.png';

  if (!Array.isArray(appJson.expo.assetBundlePatterns)) {
    appJson.expo.assetBundlePatterns = ['**/*'];
  }

  await writeJson(appJsonPath, appJson);

  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJson = await readJson<Record<string, any>>(packageJsonPath, {});
  packageJson.main = 'expo-router/entry';
  await writeJson(packageJsonPath, packageJson);

  const easPath = path.join(targetDir, 'eas.json');
  const easConfig = {
    cli: {
      version: '>= 8.0.0'
    },
    build: {
      development: {
        developmentClient: true,
        distribution: 'internal'
      },
      preview: {
        distribution: 'internal'
      },
      production: {}
    },
    submit: {}
  };
  await writeJson(easPath, easConfig);
}

async function ensureNextTurbo(targetDir: string): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJson = await readJson<Record<string, any>>(packageJsonPath, {});
  if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
    packageJson.scripts = {};
  }
  const currentDev = typeof packageJson.scripts.dev === 'string' ? packageJson.scripts.dev : 'next dev';
  if (!currentDev.includes('--turbo')) {
    packageJson.scripts.dev = `${currentDev} --turbo`;
  }
  await writeJson(packageJsonPath, packageJson);
}

function mergeEnvHelp(...lists: ModuleEnvVar[][]): ModuleEnvVar[] {
  const map = new Map<string, ModuleEnvVar>();
  for (const list of lists) {
    for (const item of list) {
      if (!map.has(item.key)) {
        map.set(item.key, item);
      }
    }
  }
  return Array.from(map.values());
}

async function ensurePackageName(targetDir: string, appName: string): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJson = await readJson<Record<string, any>>(packageJsonPath, {});
  packageJson.name = toPackageName(appName);
  await writeJson(packageJsonPath, packageJson);
}

async function writeTemplateFiles(targetDir: string, files: Array<{ path: string; content: string }>): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(targetDir, ...file.path.split('/'));
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, 'utf8');
  }
}

function mergeUnique(values: string[], additions: string[]): string[] {
  const set = new Set(values);
  for (const value of additions) {
    set.add(value);
  }
  return Array.from(set);
}

async function detectTailwindConfig(targetDir: string): Promise<string | null> {
  const candidates = [
    'tailwind.config.ts',
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs'
  ];
  for (const filename of candidates) {
    const fullPath = path.join(targetDir, filename);
    if (await pathExists(fullPath)) {
      return filename;
    }
  }
  return null;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  const data = JSON.stringify(value, null, 2);
  await fs.writeFile(filePath, `${data}\n`, 'utf8');
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function toPackageName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-._]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');
  return cleaned || 'aexis-zero-app';
}

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'aexis-zero-app';
}
