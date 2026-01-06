import path from 'path';
import { promises as fs } from 'fs';
import { execa } from 'execa';
import type { ProjectConfig } from '../types.js';
import { getFrameworkDefinition } from '../config/frameworks.js';
import { installBaseDependencies, installModulePackages } from './installers.js';
import { writeEnvExample } from './env.js';
import {
  nextLayoutTemplate,
  nextPageTemplate,
  shadcnUtilsTemplate,
  componentsJsonTemplate,
  tamaguiConfigTemplate,
  metroConfigTemplate,
  expoLayoutTemplate,
  expoIndexTemplate
} from './templates.js';

const baseEnv = {
  ...process.env,
  CI: '1'
};

export async function scaffoldProject(config: ProjectConfig): Promise<void> {
  const targetDir = path.resolve(process.cwd(), config.appName);
  await ensureEmptyTargetDir(targetDir);

  const framework = getFrameworkDefinition(config.framework);

  console.log(`Scaffolding ${framework.label}...`);
  await runScaffoldCommand(framework.scaffold.command, framework.scaffold.packageName, config.appName, framework.scaffold.argSets);

  console.log('Applying framework templates...');
  if (config.framework === 'nextjs') {
    await applyNextTemplates(targetDir);
  } else {
    await applyExpoTemplates(targetDir);
  }

  console.log('Installing base dependencies with Bun...');
  await installBaseDependencies(targetDir, framework.packages);

  console.log('Installing module packages...');
  await installModulePackages(config.framework, config.modules, targetDir);

  console.log('Generating .env.example...');
  await writeEnvExample(config.modules, targetDir);

  console.log('Scaffold complete.');
  const cdTarget = config.appName.includes(' ') ? `"${config.appName}"` : config.appName;
  console.log(`\nNext steps:\n  1) cd ${cdTarget}\n  2) bun run dev`);
}

async function ensureEmptyTargetDir(targetDir: string): Promise<void> {
  try {
    const stat = await fs.stat(targetDir);
    if (!stat.isDirectory()) {
      throw new Error('Target path exists and is not a directory.');
    }
    const entries = await fs.readdir(targetDir);
    if (entries.length > 0) {
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
  appName: string,
  argSets: string[][]
): Promise<void> {
  const errors: string[] = [];
  for (const args of argSets) {
    try {
      await execa(command, [packageName, appName, ...args], {
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

async function applyNextTemplates(targetDir: string): Promise<void> {
  const rootAppDir = path.join(targetDir, 'app');
  const srcAppDir = path.join(targetDir, 'src', 'app');
  const usesSrcDir = await pathExists(srcAppDir);
  const appDir = usesSrcDir ? srcAppDir : rootAppDir;
  const projectSrcBase = usesSrcDir ? path.join(targetDir, 'src') : targetDir;
  await fs.mkdir(appDir, { recursive: true });
  await fs.writeFile(path.join(appDir, 'layout.tsx'), nextLayoutTemplate, 'utf8');
  await fs.writeFile(path.join(appDir, 'page.tsx'), nextPageTemplate, 'utf8');
  await ensureShadcnSetup(targetDir, projectSrcBase, usesSrcDir);
  await ensureNextTurbo(targetDir);
}

async function applyExpoTemplates(targetDir: string): Promise<void> {
  const appDir = path.join(targetDir, 'app');
  await fs.mkdir(appDir, { recursive: true });
  await fs.writeFile(path.join(appDir, '_layout.tsx'), expoLayoutTemplate, 'utf8');
  await fs.writeFile(path.join(appDir, 'index.tsx'), expoIndexTemplate, 'utf8');
  await ensureExpoConfig(targetDir);
  await ensureExpoTamagui(targetDir);
}

async function ensureExpoConfig(targetDir: string): Promise<void> {
  const appJsonPath = path.join(targetDir, 'app.json');
  const appJson = await readJson<Record<string, any>>(appJsonPath, { expo: {} });
  if (!appJson.expo || typeof appJson.expo !== 'object') {
    appJson.expo = {};
  }

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

function mergeUnique(values: string[], additions: string[]): string[] {
  const set = new Set(values);
  for (const value of additions) {
    set.add(value);
  }
  return Array.from(set);
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

async function ensureShadcnSetup(targetDir: string, projectSrcBase: string, usesSrcDir: boolean): Promise<void> {
  const libDir = path.join(projectSrcBase, 'lib');
  await fs.mkdir(libDir, { recursive: true });
  await fs.writeFile(path.join(libDir, 'utils.ts'), shadcnUtilsTemplate, 'utf8');

  const globalsPath = usesSrcDir ? 'src/app/globals.css' : 'app/globals.css';
  const tailwindConfigPath = await detectTailwindConfig(targetDir);
  const componentsJson = componentsJsonTemplate(globalsPath, tailwindConfigPath ?? 'tailwind.config.ts');
  await fs.writeFile(path.join(targetDir, 'components.json'), componentsJson, 'utf8');
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

async function ensureExpoTamagui(targetDir: string): Promise<void> {
  const configPath = path.join(targetDir, 'tamagui.config.ts');
  await fs.writeFile(configPath, tamaguiConfigTemplate, 'utf8');

  const metroPath = path.join(targetDir, 'metro.config.js');
  await fs.writeFile(metroPath, metroConfigTemplate, 'utf8');

  await ensureBabelTamagui(targetDir);
}

async function ensureBabelTamagui(targetDir: string): Promise<void> {
  const babelPath = path.join(targetDir, 'babel.config.js');
  let content = '';
  if (await pathExists(babelPath)) {
    content = await fs.readFile(babelPath, 'utf8');
  }

  if (!content) {
    const defaultConfig = `module.exports = function (api) {\n  api.cache(true);\n  return {\n    presets: ['babel-preset-expo'],\n    plugins: [\n      'expo-router/babel',\n      [\n        '@tamagui/babel-plugin',\n        {\n          config: './tamagui.config.ts',\n          components: ['tamagui']\n        }\n      ]\n    ]\n  };\n};\n`;
    await fs.writeFile(babelPath, defaultConfig, 'utf8');
    return;
  }

  if (content.includes('@tamagui/babel-plugin')) {
    return;
  }

  const pluginSnippet = `[\n        '@tamagui/babel-plugin',\n        {\n          config: './tamagui.config.ts',\n          components: ['tamagui']\n        }\n      ]`;

  const pluginsRegex = /plugins:\\s*\\[(.*)\\]/s;
  if (pluginsRegex.test(content)) {
    content = content.replace(pluginsRegex, (match, inner) => {
      const trimmed = inner.trim();
      const updatedInner = trimmed.length > 0 ? `${trimmed},\n      ${pluginSnippet}` : pluginSnippet;
      return `plugins: [${updatedInner}]`;
    });
  } else {
    content = content.replace(/return\\s*\\{/, (match) => `${match}\n    plugins: [${pluginSnippet}],`);
  }

  await fs.writeFile(babelPath, content, 'utf8');
}
