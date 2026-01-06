export const nextLayoutTemplate = `import type { ReactNode } from 'react';

export const metadata = {
  title: 'Aexis Zero App',
  description: 'Scaffolded by Aexis Zero.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

export const nextPageTemplate = `export default function Home() {
  return <main />;
}
`;

export const shadcnUtilsTemplate = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

export const componentsJsonTemplate = (globalsPath: string, tailwindConfigPath: string) => `{
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

export const tamaguiConfigTemplate = `import { config } from '@tamagui/config/v3';

export default config;
`;

export const metroConfigTemplate = `const { getDefaultConfig } = require('expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');

const config = getDefaultConfig(__dirname);

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css'
});
`;

export const expoLayoutTemplate = `import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  );
}
`;

export const expoIndexTemplate = `import { Button, H1, YStack } from 'tamagui';

export default function Home() {
  return (
    <YStack flex={1} alignItems=\"center\" justifyContent=\"center\" gap=\"$4\">
      <H1>Aexis Zero</H1>
      <Button>Start building</Button>
    </YStack>
  );
}
`;
