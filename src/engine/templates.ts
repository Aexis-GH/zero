import type { ModuleEnvVar } from '../config/modules.js';

interface TemplateData {
  appName: string;
  domain: string;
  envVars: ModuleEnvVar[];
  basePath: string;
}

export function componentsJsonTemplate(globalsPath: string, tailwindConfigPath: string): string {
  return `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "${tailwindConfigPath}",
    "css": "${globalsPath}",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
`;
}

export function buildNextTemplateFiles(data: TemplateData): Array<{ path: string; content: string }> {
  const base = data.basePath ? `${data.basePath}/` : '';
  const envList = renderNextEnvList(data.envVars);

  return [
    {
      path: `${base}app/layout.tsx`,
      content: nextLayoutTemplate(data.appName, data.domain)
    },
    {
      path: `${base}app/page.tsx`,
      content: nextHomeTemplate(data.appName, data.domain, envList)
    },
    {
      path: `${base}app/about/page.tsx`,
      content: nextRouteTemplate('About', 'A concise overview of your project.')
    },
    {
      path: `${base}app/guide/page.tsx`,
      content: nextRouteTemplate('Guide', 'Three routes are ready. Customize and ship.')
    },
    {
      path: `${base}app/globals.css`,
      content: nextGlobalsCss()
    },
    {
      path: `${base}components/site-header.tsx`,
      content: nextHeaderTemplate(data.appName)
    },
    {
      path: `${base}components/site-footer.tsx`,
      content: nextFooterTemplate(data.domain)
    },
    {
      path: `${base}components/env-list.tsx`,
      content: nextEnvListTemplate(envList)
    },
    {
      path: `${base}lib/utils.ts`,
      content: nextUtilsTemplate()
    }
  ];
}

export function buildExpoTemplateFiles(data: TemplateData): Array<{ path: string; content: string }> {
  const envItems = renderExpoEnvItems(data.envVars);
  return [
    {
      path: 'app/_layout.tsx',
      content: expoLayoutTemplate()
    },
    {
      path: 'app/index.tsx',
      content: expoHomeTemplate(data.appName, data.domain, envItems)
    },
    {
      path: 'app/about.tsx',
      content: expoRouteTemplate('About', 'A concise overview of your project.')
    },
    {
      path: 'app/guide.tsx',
      content: expoRouteTemplate('Guide', 'Three routes are ready. Customize and ship.')
    },
    {
      path: 'components/theme.ts',
      content: expoThemeTemplate()
    },
    {
      path: 'components/site-header.tsx',
      content: expoHeaderTemplate(data.appName)
    },
    {
      path: 'components/site-footer.tsx',
      content: expoFooterTemplate(data.domain)
    },
    {
      path: 'components/env-list.tsx',
      content: expoEnvListTemplate(envItems)
    },
    {
      path: 'components/page-shell.tsx',
      content: expoPageShellTemplate()
    },
    {
      path: 'tamagui.config.ts',
      content: tamaguiConfigTemplate()
    },
    {
      path: 'metro.config.js',
      content: metroConfigTemplate()
    },
    {
      path: 'babel.config.js',
      content: babelConfigTemplate()
    }
  ];
}

function nextLayoutTemplate(appName: string, domain: string): string {
  return `import type { ReactNode } from 'react';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata = {
  title: '${escapeTemplate(appName)}',
  description: 'Scaffolded by Aexis Zero.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <div className="flex min-h-screen flex-col">
          <SiteHeader appName="${escapeTemplate(appName)}" />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
`;
}

function nextHomeTemplate(appName: string, domain: string, envList: string): string {
  return `import { EnvList } from '@/components/env-list';

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.4em]">Hello World</p>
        <h1 className="text-3xl font-thin">${escapeTemplate(appName)}</h1>
        <p className="text-sm">
          ${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'No domain configured yet.'}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--fg)] p-6">
        <h2 className="text-lg font-medium">Environment variables</h2>
        <p className="text-sm">Set these in your <code className="rounded bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">.env</code>.</p>
        <EnvList />
      </div>
      <div className="rounded-xl border border-[var(--fg)] p-6">
        <h2 className="text-lg font-medium">Routes</h2>
        <p className="text-sm">Explore <code className="rounded bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/about</code> and <code className="rounded bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/guide</code>.</p>
      </div>
    </section>
  );
}
`;
}

function nextRouteTemplate(title: string, body: string): string {
  return `export default function Page() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-thin">${title}</h1>
      <p className="text-sm">${body}</p>
    </section>
  );
}
`;
}

function nextHeaderTemplate(appName: string): string {
  return `import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' }
];

export function SiteHeader({ appName }: { appName: string }) {
  return (
    <header className="border-b border-[var(--fg)]">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-thin tracking-[0.3em]">ZER0</span>
          <span className="text-xs uppercase tracking-[0.2em]">{appName}</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <details className="sm:hidden">
          <summary className="cursor-pointer text-sm">Menu</summary>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
`;
}

function nextFooterTemplate(domain: string): string {
  const domainLabel = escapeTemplate(domain).trim().length > 0
    ? `Domain: ${escapeTemplate(domain)}`
    : 'Domain: not set';

  return `export function SiteFooter() {
  return (
    <footer className=\"border-t border-[var(--fg)]\">
      <div className=\"mx-auto flex w-full max-w-4xl flex-col gap-2 px-6 py-4 text-xs\">
        <span>${domainLabel}</span>
        <span>Generated by Aexis Zero.</span>
      </div>
    </footer>
  );
}
`;
}

function nextEnvListTemplate(envList: string): string {
  return `export function EnvList() {
  return (
    <div className="mt-4 flex flex-col gap-4">
      ${envList}
    </div>
  );
}
`;
}

function nextUtilsTemplate(): string {
  return `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

function nextGlobalsCss(): string {
  return `@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #E7E5E4;
  --fg: #1C1917;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1C1917;
    --fg: #E7E5E4;
  }
}

* {
  border-color: var(--fg);
}

html,
body {
  min-height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 4px;
}

code {
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
`;
}

function renderNextEnvList(envVars: ModuleEnvVar[]): string {
  if (envVars.length === 0) {
    return '<p className="text-sm">No environment variables required.</p>';
  }

  return envVars
    .map((item) => {
      return `
      <div className="rounded-lg border border-[var(--fg)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">${escapeTemplate(item.key)}</code>
          <span className="text-sm">${escapeTemplate(item.description)}</span>
        </div>
        <a
          className="mt-2 inline-flex text-sm underline underline-offset-4"
          href="${escapeAttribute(item.url)}"
          target="_blank"
          rel="noreferrer"
        >
          Get keys →
        </a>
      </div>`;
    })
    .join('\n');
}

function expoLayoutTemplate(): string {
  return `import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { useColorScheme } from 'react-native';
import { useFonts, GeistMono_100Thin } from '@expo-google-fonts/geist-mono';
import config from '../tamagui.config';

export default function RootLayout() {
  const scheme = useColorScheme();
  const [loaded] = useFonts({ GeistMono_100Thin });

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <Theme name={scheme === 'dark' ? 'dark' : 'light'}>
        <Stack screenOptions={{ headerShown: false }} />
      </Theme>
    </TamaguiProvider>
  );
}
`;
}

function expoHomeTemplate(appName: string, domain: string, envItems: string): string {
  return `import { Text, YStack } from 'tamagui';
import { PageShell } from '../components/page-shell';
import { EnvList } from '../components/env-list';
import { FONT_FAMILY, useThemeColors } from '../components/theme';

export default function Home() {
  const { fg } = useThemeColors();

  return (
    <PageShell
      title="${escapeTemplate(appName)}"
      subtitle="${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'No domain configured yet.'}"
      badge="Hello World"
    >
      <YStack borderWidth={1} borderColor={fg} padding="$4" borderRadius="$4" gap="$3">
        <Text fontFamily={FONT_FAMILY} fontSize="$4" color={fg}>
          Environment variables
        </Text>
        <EnvList />
      </YStack>
      <YStack borderWidth={1} borderColor={fg} padding="$4" borderRadius="$4" gap="$3">
        <Text fontFamily={FONT_FAMILY} fontSize="$4" color={fg}>
          Routes
        </Text>
        <Text fontFamily={FONT_FAMILY} fontSize="$2" color={fg}>
          Visit /about and /guide.
        </Text>
      </YStack>
    </PageShell>
  );
}
`;
}

function expoRouteTemplate(title: string, body: string): string {
  return `import { PageShell } from '../components/page-shell';

export default function Page() {
  return (
    <PageShell title="${title}" subtitle="${body}">
      <></>
    </PageShell>
  );
}
`;
}

function expoThemeTemplate(): string {
  return `import { useColorScheme } from 'react-native';

export const COLORS = {
  light: {
    bg: '#E7E5E4',
    fg: '#1C1917'
  },
  dark: {
    bg: '#1C1917',
    fg: '#E7E5E4'
  }
};

export const FONT_FAMILY = 'GeistMono_100Thin';

export function useThemeColors() {
  const scheme = useColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  return {
    mode,
    bg: COLORS[mode].bg,
    fg: COLORS[mode].fg
  };
}
`;
}

function expoHeaderTemplate(appName: string): string {
  return `import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, Text, XStack, YStack } from 'tamagui';
import { FONT_FAMILY, useThemeColors } from './theme';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { bg, fg } = useThemeColors();

  return (
    <YStack backgroundColor={bg} paddingHorizontal="$5" paddingVertical="$4" borderBottomWidth={1} borderColor={fg}>
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <Text fontFamily={FONT_FAMILY} fontWeight="100" fontSize="$6" color={fg}>
            ZER0
          </Text>
          <Text fontFamily={FONT_FAMILY} fontSize="$2" textTransform="uppercase" color={fg}>
            ${escapeTemplate(appName)}
          </Text>
        </XStack>
        <Button
          backgroundColor={fg}
          color={bg}
          fontFamily={FONT_FAMILY}
          size="$2"
          onPress={() => setOpen((prev) => !prev)}
        >
          Menu
        </Button>
      </XStack>
      {open ? (
        <YStack marginTop="$3" gap="$2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} asChild>
              <Text fontFamily={FONT_FAMILY} textDecorationLine="underline" color={fg}>
                {link.label}
              </Text>
            </Link>
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}
`;
}

function expoFooterTemplate(domain: string): string {
  return `import { Text, YStack } from 'tamagui';
import { FONT_FAMILY, useThemeColors } from './theme';

export function SiteFooter() {
  const { bg, fg } = useThemeColors();

  return (
    <YStack backgroundColor={bg} paddingHorizontal="$5" paddingVertical="$4" borderTopWidth={1} borderColor={fg}>
      <Text fontFamily={FONT_FAMILY} fontSize="$2" color={fg}>
        ${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'Domain: not set'}
      </Text>
      <Text fontFamily={FONT_FAMILY} fontSize="$2" color={fg}>
        Generated by Aexis Zero.
      </Text>
    </YStack>
  );
}
`;
}

function expoEnvListTemplate(envItems: string): string {
  return `import { Linking } from 'react-native';
import { Text, YStack } from 'tamagui';
import { FONT_FAMILY, useThemeColors } from './theme';

const envItems = ${envItems};

export function EnvList() {
  const { bg, fg } = useThemeColors();

  if (envItems.length === 0) {
    return (
      <Text fontFamily={FONT_FAMILY} fontSize="$2" color={fg}>
        No environment variables required.
      </Text>
    );
  }

  return (
    <YStack gap="$3">
      {envItems.map((item) => (
        <YStack key={item.key} borderWidth={1} borderColor={fg} padding="$3" borderRadius="$4">
          <Text fontFamily={FONT_FAMILY} color={fg}>{item.description}</Text>
          <Text
            fontFamily={FONT_FAMILY}
            backgroundColor={fg}
            color={bg}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            marginTop="$2"
          >
            {item.key}
          </Text>
          <Text
            fontFamily={FONT_FAMILY}
            textDecorationLine="underline"
            color={fg}
            marginTop="$2"
            onPress={() => Linking.openURL(item.url)}
          >
            Get keys →
          </Text>
        </YStack>
      ))}
    </YStack>
  );
}
`;
}

function expoPageShellTemplate(): string {
  return `import type { ReactNode } from 'react';
import { ScrollView, Text, YStack } from 'tamagui';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { FONT_FAMILY, useThemeColors } from './theme';

interface PageShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, badge, children }: PageShellProps) {
  const { bg, fg } = useThemeColors();

  return (
    <YStack flex={1} backgroundColor={bg}>
      <SiteHeader />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <YStack gap="$4">
          {badge ? (
            <Text fontFamily={FONT_FAMILY} fontSize="$2" textTransform="uppercase" letterSpacing={2} color={fg}>
              {badge}
            </Text>
          ) : null}
          <Text fontFamily={FONT_FAMILY} fontSize="$7" color={fg}>
            {title}
          </Text>
          <Text fontFamily={FONT_FAMILY} fontSize="$3" color={fg}>
            {subtitle}
          </Text>
          {children}
        </YStack>
      </ScrollView>
      <SiteFooter />
    </YStack>
  );
}
`;
}

function tamaguiConfigTemplate(): string {
  return `import { config } from '@tamagui/config/v3';

export default config;
`;
}

function metroConfigTemplate(): string {
  return `const { getDefaultConfig } = require('expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');

const config = getDefaultConfig(__dirname);

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css'
});
`;
}

function babelConfigTemplate(): string {
  return `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      [
        '@tamagui/babel-plugin',
        {
          config: './tamagui.config.ts',
          components: ['tamagui']
        }
      ]
    ]
  };
};
`;
}

function renderExpoEnvItems(envVars: ModuleEnvVar[]): string {
  if (envVars.length === 0) {
    return '[]';
  }
  const items = envVars.map((item) => {
    return `{
      key: '${escapeTemplate(item.key)}',
      description: '${escapeTemplate(item.description)}',
      url: '${escapeTemplate(item.url)}'
    }`;
  });
  return `[
    ${items.join(',\n    ')}
  ]`;
}

function escapeTemplate(value: string): string {
  return value
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}

function escapeAttribute(value: string): string {
  return value.replace(/"/g, '&quot;');
}
