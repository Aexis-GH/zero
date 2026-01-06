import type { FrameworkId } from '../types.js';

export interface FrameworkDefinition {
  id: FrameworkId;
  label: string;
  description: string;
  packages: string[];
  scaffold: {
    packageName: string;
    argSets: string[][];
  };
}

export const frameworks: FrameworkDefinition[] = [
  {
    id: 'nextjs',
    label: 'Next.js',
    description: 'React framework with App Router and Tailwind.',
    packages: [
      'class-variance-authority',
      'clsx',
      'lucide-react',
      'tailwind-merge',
      'tailwindcss-animate',
      '@radix-ui/react-slot'
    ],
    scaffold: {
      packageName: 'create-next-app@latest',
      argSets: [
        [
          '--ts',
          '--eslint',
          '--tailwind',
          '--turbo',
          '--app',
          '--no-src-dir',
          '--import-alias',
          '@/*',
          '--skip-install'
        ],
        [
          '--ts',
          '--eslint',
          '--tailwind',
          '--turbo',
          '--app',
          '--no-src-dir',
          '--import-alias',
          '@/*',
        ],
        [
          '--ts',
          '--eslint',
          '--tailwind',
          '--turbo',
          '--app',
          '--no-src-dir',
          '--import-alias',
          '@/*'
        ],
        [
          '--ts',
          '--eslint',
          '--tailwind',
          '--app',
          '--no-src-dir',
          '--import-alias',
          '@/*'
        ]
      ]
    }
  },
  {
    id: 'expo',
    label: 'Expo (React Native)',
    description: 'Expo app with Router and EAS configuration.',
    packages: [
      'expo-router',
      'expo-font',
      '@expo-google-fonts/geist-mono',
      'tamagui',
      '@tamagui/config',
      '@tamagui/animations-react-native',
      '@tamagui/metro-plugin',
      '@tamagui/babel-plugin',
      'react-native-svg'
    ],
    scaffold: {
      packageName: 'create-expo-app',
      argSets: [
        ['--template', 'expo-router', '--yes', '--no-install'],
        ['--template', 'expo-router', '--yes'],
        ['--yes', '--no-install'],
        ['--yes'],
        []
      ]
    }
  }
];

export function getFrameworkDefinition(id: FrameworkId): FrameworkDefinition {
  const framework = frameworks.find((item) => item.id === id);
  if (!framework) {
    throw new Error(`Unknown framework: ${id}`);
  }
  return framework;
}
