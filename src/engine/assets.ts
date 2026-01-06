import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

export interface AssetSources {
  iconSvg: string;
  iconPng: string;
  socialPng: string;
}

export interface AssetTargets {
  appDir: string;
  publicDir: string;
  assetsDir: string;
}

export function resolveAssetSources(): AssetSources {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(currentDir, '..', '..');
  const assetsDir = path.join(rootDir, 'assets');
  return {
    iconSvg: path.join(assetsDir, 'icon.svg'),
    iconPng: path.join(assetsDir, 'icon.png'),
    socialPng: path.join(assetsDir, 'social.png')
  };
}

export async function assertAssetSources(sources: AssetSources): Promise<void> {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(sources)) {
    try {
      await fs.stat(value);
    } catch {
      missing.push(`${key}: ${value}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing asset files. Add them to the CLI package under /assets:\n${missing.join('\n')}`);
  }
}

export async function generateNextAssets(
  sources: AssetSources,
  targets: AssetTargets
): Promise<void> {
  await fs.mkdir(targets.appDir, { recursive: true });
  await fs.mkdir(targets.publicDir, { recursive: true });

  await fs.copyFile(sources.iconSvg, path.join(targets.appDir, 'icon.svg'));
  await resizePng(sources.iconPng, path.join(targets.appDir, 'apple-icon.png'), 180, 180);

  await resizePng(sources.socialPng, path.join(targets.appDir, 'opengraph-image.png'), 1200, 630);
  await resizePng(sources.socialPng, path.join(targets.appDir, 'twitter-image.png'), 1200, 630);

  await resizePng(sources.iconPng, path.join(targets.publicDir, 'favicon-16x16.png'), 16, 16);
  await resizePng(sources.iconPng, path.join(targets.publicDir, 'favicon-32x32.png'), 32, 32);
  await resizePng(sources.iconPng, path.join(targets.publicDir, 'apple-touch-icon.png'), 180, 180);
  await resizePng(sources.iconPng, path.join(targets.publicDir, 'android-chrome-192x192.png'), 192, 192);
  await resizePng(sources.iconPng, path.join(targets.publicDir, 'android-chrome-512x512.png'), 512, 512);
}

export async function generateExpoAssets(
  sources: AssetSources,
  targets: AssetTargets
): Promise<void> {
  await fs.mkdir(targets.assetsDir, { recursive: true });

  await resizePng(sources.iconPng, path.join(targets.assetsDir, 'icon.png'), 1024, 1024);
  await resizePng(sources.iconPng, path.join(targets.assetsDir, 'adaptive-icon.png'), 1024, 1024);
  await resizePng(sources.iconPng, path.join(targets.assetsDir, 'favicon.png'), 48, 48);
  await resizePng(sources.socialPng, path.join(targets.assetsDir, 'splash.png'), 1200, 630);
}

async function resizePng(source: string, destination: string, width: number, height: number): Promise<void> {
  await sharp(source)
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(destination);
}
