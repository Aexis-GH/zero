import type { ModuleConnection, ModuleEnvVar } from '../config/modules.js';

interface TemplateData {
  appName: string;
  domain: string;
  envVars: ModuleEnvVar[];
  connections: ModuleConnection[];
  basePath: string;
  includeContact: boolean;
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
  const connectionSection = renderNextConnectionSection(data.connections);
  const includeContact = data.includeContact;

  const files: Array<{ path: string; content: string }> = [
    {
      path: `${base}app/layout.tsx`,
      content: nextLayoutTemplate(data.appName, data.domain)
    },
    {
      path: `${base}app/page.tsx`,
      content: nextHomeTemplate(data.appName, data.domain, envList, connectionSection, includeContact)
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
      content: nextHeaderTemplate(data.appName, includeContact)
    },
    {
      path: `${base}components/site-footer.tsx`,
      content: nextFooterTemplate(data.domain)
    },
    {
      path: `${base}components/connection-guide.tsx`,
      content: nextConnectionGuideTemplate(data.connections)
    },
    {
      path: `${base}components/env-list.tsx`,
      content: nextEnvListTemplate(envList)
    },
    {
      path: `${base}components/ui/button.tsx`,
      content: nextButtonTemplate()
    },
    {
      path: `${base}components/ui/input.tsx`,
      content: nextInputTemplate()
    },
    {
      path: `${base}components/ui/textarea.tsx`,
      content: nextTextareaTemplate()
    },
    {
      path: `${base}lib/utils.ts`,
      content: nextUtilsTemplate()
    }
  ];

  if (includeContact) {
    files.splice(4, 0, {
      path: `${base}app/contact/page.tsx`,
      content: nextContactPageTemplate()
    });
    files.splice(5, 0, {
      path: `${base}app/api/contact/route.ts`,
      content: nextContactRouteTemplate(data.appName)
    });
    files.push({
      path: `${base}components/contact-form.tsx`,
      content: nextContactFormTemplate()
    });
  }

  return files;
}

export function buildExpoTemplateFiles(data: TemplateData): Array<{ path: string; content: string }> {
  const envItems = renderExpoEnvItems(data.envVars);
  const connectionItems = renderConnectionItems(data.connections);
  const includeContact = data.includeContact;
  const files: Array<{ path: string; content: string }> = [
    {
      path: 'app/_layout.tsx',
      content: expoLayoutTemplate()
    },
    {
      path: 'app/index.tsx',
      content: expoHomeTemplate(data.appName, data.domain, envItems, includeContact)
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
      content: expoHeaderTemplate(data.appName, includeContact)
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
      path: 'components/connection-guide.tsx',
      content: expoConnectionGuideTemplate(connectionItems)
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

  if (includeContact) {
    files.splice(2, 0, {
      path: 'app/contact.tsx',
      content: expoContactTemplate()
    });
    files.push({
      path: 'components/contact-form.tsx',
      content: expoContactFormTemplate()
    });
  }

  return files;
}

function nextLayoutTemplate(appName: string, domain: string): string {
  const description = `${escapeTemplate(appName)} starter crafted by Aexis Zero.`;
  const domainValue = escapeTemplate(domain);
  const metadataBase = domainValue ? `new URL('https://${domainValue}')` : 'undefined';
  return `import type { ReactNode } from 'react';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata = {
  title: {
    default: '${escapeTemplate(appName)}',
    template: '%s | ${escapeTemplate(appName)}'
  },
  description: '${description}',
  metadataBase: ${metadataBase},
  openGraph: {
    title: '${escapeTemplate(appName)}',
    description: '${description}',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: '${escapeTemplate(appName)}',
    description: '${description}'
  }
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
          <main className="flex flex-1 items-center justify-center">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
`;
}

function nextHomeTemplate(
  appName: string,
  domain: string,
  envList: string,
  connectionSection: string,
  includeContact: boolean
): string {
  const contactImport = includeContact ? "import { ContactForm } from '@/components/contact-form';\n" : '';
  const contactSection = includeContact ? '\n      <ContactForm />' : '';
  const routeList = includeContact
    ? `Explore <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/about</code>,{' '}
          <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/guide</code>, and{' '}
          <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/contact</code>.`
    : `Explore <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/about</code> and{' '}
          <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">/guide</code>.`;

  return `import { EnvList } from '@/components/env-list';
${contactImport}import { ConnectionGuide } from '@/components/connection-guide';

export const metadata = {
  title: 'Home',
  description: 'A minimal starter with routes, metadata, and env var guidance.'
};

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold uppercase tracking-[0.4em]">Hello World</p>
        <h1 className="text-base font-bold">${escapeTemplate(appName)}</h1>
        <p className="text-base">
          ${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'No domain configured yet.'}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold">Environment variables</h2>
        <p className="text-base">
          Set these in your <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">.env</code>.
        </p>
        <EnvList />
      </div>
      ${connectionSection}
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Routes</h2>
        <p className="text-base">
          ${routeList}
        </p>
      </div>
      ${contactSection}
    </section>
  );
}
`;
}

function nextRouteTemplate(title: string, body: string): string {
  return `export const metadata = {
  title: '${title}',
  description: '${body}'
};

export default function Page() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-base font-bold">${title}</h1>
      <p className="text-base">${body}</p>
    </section>
  );
}
`;
}

function nextHeaderTemplate(appName: string, includeContact: boolean): string {
  const contactLink = includeContact ? "\n  { href: '/contact', label: 'Contact' }" : '';
  return `import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' },${contactLink}
];

export function SiteHeader({ appName }: { appName: string }) {
  return (
    <header>
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold tracking-[0.3em]">ZER0</span>
          <span className="text-base font-bold uppercase tracking-[0.2em]">{appName}</span>
        </div>
        <nav className="hidden items-center gap-6 text-base sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <details className="sm:hidden">
          <summary className="cursor-pointer text-base font-bold">Menu</summary>
          <div className="mt-3 flex flex-col gap-3 text-base">
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
    <footer>
      <div className=\"mx-auto flex w-full max-w-4xl flex-col gap-2 px-6 py-6 text-base\">
        <span>${domainLabel}</span>
        <span>Generated by Aexis Zero.</span>
      </div>
    </footer>
  );
}
`;
}

function nextEnvListTemplate(envList: string): string {
  return `import { Button } from '@/components/ui/button';

export function EnvList() {
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

function nextButtonTemplate(): string {
  return `import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center text-base font-bold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-b border-[var(--fg)]',
        link: 'underline underline-offset-4'
      }
    },
    defaultVariants: {
      variant: 'link'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
`;
}

function nextInputTemplate(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('border-b border-[var(--fg)] bg-transparent py-1 text-base focus-visible:outline-none', className)}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
`;
}

function nextTextareaTemplate(): string {
  return `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[96px] border-b border-[var(--fg)] bg-transparent py-1 text-base focus-visible:outline-none',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
`;
}

function nextContactFormTemplate(): string {
  return `'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Status = 'idle' | 'sending' | 'sent' | 'error';

type FormState = {
  name: string;
  email: string;
  message: string;
};

const initialState: FormState = {
  name: '',
  email: '',
  message: ''
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const updateField =
    (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setError('All fields are required.');
      return;
    }

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim()
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Unable to send message.');
      }

      setStatus('sent');
      setForm(initialState);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  return (
    <form className="flex flex-col gap-4 text-base" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Contact</h2>
        <p className="text-base">Send a quick note to your inbox.</p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-base font-bold">Name</span>
        <Input value={form.name} onChange={updateField('name')} type="text" autoComplete="name" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-base font-bold">Email</span>
        <Input value={form.email} onChange={updateField('email')} type="email" autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-base font-bold">Message</span>
        <Textarea value={form.message} onChange={updateField('message')} rows={4} />
      </label>
      <Button className="self-start" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send message'}
      </Button>
      {status === 'sent' ? (
        <p className="text-base" role="status">
          Message sent.
        </p>
      ) : null}
      {status === 'error' && error ? (
        <p className="text-base" role="status">
          {error}
        </p>
      ) : null}
    </form>
  );
}
`;
}

function nextContactRouteTemplate(appName: string): string {
  return `import { Resend } from 'resend';

type Payload = {
  name: string;
  email: string;
  message: string;
};

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();

  if (!apiKey || !from || !to) {
    return Response.json(
      { error: 'Set RESEND_API_KEY, CONTACT_FROM_EMAIL, and CONTACT_TO_EMAIL.' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as Partial<Payload> | null;
  if (!body || !isNonEmpty(body.name) || !isNonEmpty(body.email) || !isNonEmpty(body.message)) {
    return Response.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const name = body.name.trim();
  const email = body.email.trim();
  const message = body.message.trim();

  try {
    await resend.emails.send({
      from,
      to,
      subject: 'New message from ${escapeTemplate(appName)}',
      text: \`Name: \${name}\\nEmail: \${email}\\n\\n\${message}\`
    });
  } catch (error) {
    return Response.json({ error: 'Failed to send message.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
`;
}

function nextContactPageTemplate(): string {
  return `import { ContactForm } from '@/components/contact-form';

export const metadata = {
  title: 'Contact',
  description: 'Send a message to your inbox.'
};

export default function ContactPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-base font-bold">Contact</h1>
      <p className="text-base">Send a message to your inbox.</p>
      <ContactForm />
    </section>
  );
}
`;
}

function nextGlobalsCss(): string {
  return `@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;700&display=swap');

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

html,
body {
  min-height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 16px;
  font-weight: 400;
}

a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 4px;
}

code {
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

button,
input,
textarea {
  font: inherit;
  color: inherit;
}
`;
}

function renderNextEnvList(envVars: ModuleEnvVar[]): string {
  if (envVars.length === 0) {
    return '<p className="text-base">No environment variables required.</p>';
  }

  return envVars
    .map((item) => {
      const link = item.url
        ? `
        <Button asChild variant="link">
          <a
            href="${escapeAttribute(item.url)}"
            target="_blank"
            rel="noreferrer"
          >
            Get keys &gt;
          </a>
        </Button>`
        : '';
      return `
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="bg-[var(--fg)] px-2 py-1 text-[var(--bg)]">${escapeTemplate(item.key)}</code>
          <span className="text-base">${escapeTemplate(item.description)}</span>
        </div>
        ${link}
      </div>`;
    })
    .join('\n');
}

function renderNextConnectionSection(_connections: ModuleConnection[]): string {
  return '<ConnectionGuide />';
}

function nextConnectionGuideTemplate(connections: ModuleConnection[]): string {
  const items = renderConnectionItems(connections);
  return `import Link from 'next/link';
import { Button } from '@/components/ui/button';

const connections = ${items};

export function ConnectionGuide() {
  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold">Connection guide</h2>
      {connections.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <Button asChild variant="link">
            <Link href={item.url} target="_blank" rel="noreferrer">
              {item.label}
            </Link>
          </Button>
          <p className="text-base">
            or go to{' '}
            <Button asChild variant="link">
              <Link href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </Link>
            </Button>{' '}
            directly.
          </p>
        </div>
      ))}
    </div>
  );
}
`;
}

function expoLayoutTemplate(): string {
  return `import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { useColorScheme } from 'react-native';
import { useFonts, GeistMono_400Regular, GeistMono_700Bold } from '@expo-google-fonts/geist-mono';
import config from '../tamagui.config';

export default function RootLayout() {
  const scheme = useColorScheme();
  const [loaded] = useFonts({ GeistMono_400Regular, GeistMono_700Bold });

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

function expoHomeTemplate(appName: string, domain: string, envItems: string, includeContact: boolean): string {
  const contactImport = includeContact ? "import { ContactForm } from '../components/contact-form';\n" : '';
  const contactSection = includeContact ? '\n      <ContactForm />' : '';
  const routeLine = includeContact ? 'Visit /about, /guide, and /contact.' : 'Visit /about and /guide.';

  return `import { Head } from 'expo-router/head';
import { Text, YStack } from 'tamagui';
import { PageShell } from '../components/page-shell';
import { EnvList } from '../components/env-list';
import { ConnectionGuide } from '../components/connection-guide';
${contactImport}
import { FONT_BOLD, FONT_REGULAR, FONT_SIZE, useThemeColors } from '../components/theme';

export default function Home() {
  const { fg } = useThemeColors();

  return (
    <PageShell
      title="${escapeTemplate(appName)}"
      subtitle="${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'No domain configured yet.'}"
      badge="Hello World"
    >
      <Head>
        <title>${escapeTemplate(appName)} | Home</title>
        <meta name="description" content="A minimal starter with routes, metadata, and env var guidance." />
        <meta property="og:title" content="${escapeTemplate(appName)}" />
        <meta property="og:description" content="A minimal starter with routes, metadata, and env var guidance." />
        <meta property="twitter:card" content="summary_large_image" />
      </Head>
      <YStack gap="$3">
        <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
          Environment variables
        </Text>
        <EnvList />
      </YStack>
      <ConnectionGuide />
      <YStack gap="$2">
        <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
          Routes
        </Text>
        <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
          ${routeLine}
        </Text>
      </YStack>
      ${contactSection}
    </PageShell>
  );
}
`;
}

function expoContactTemplate(): string {
  return `import { Head } from 'expo-router/head';
import { PageShell } from '../components/page-shell';
import { ContactForm } from '../components/contact-form';

export default function Contact() {
  return (
    <PageShell title="Contact" subtitle="Send a message to your inbox.">
      <Head>
        <title>Contact</title>
        <meta name="description" content="Send a message to your inbox." />
        <meta property="og:title" content="Contact" />
        <meta property="og:description" content="Send a message to your inbox." />
        <meta property="twitter:card" content="summary_large_image" />
      </Head>
      <ContactForm />
    </PageShell>
  );
}
`;
}

function expoRouteTemplate(title: string, body: string): string {
  return `import { Head } from 'expo-router/head';
import { PageShell } from '../components/page-shell';

export default function Page() {
  return (
    <PageShell title="${title}" subtitle="${body}">
      <Head>
        <title>${title}</title>
        <meta name="description" content="${body}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${body}" />
        <meta property="twitter:card" content="summary_large_image" />
      </Head>
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

export const FONT_REGULAR = 'GeistMono_400Regular';
export const FONT_BOLD = 'GeistMono_700Bold';
export const FONT_SIZE = 16;

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

function expoHeaderTemplate(appName: string, includeContact: boolean): string {
  const contactLink = includeContact ? "\n  { href: '/contact', label: 'Contact' }" : '';
  return `import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, Text, XStack, YStack } from 'tamagui';
import { FONT_BOLD, FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' },${contactLink}
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { bg, fg } = useThemeColors();

  return (
    <YStack backgroundColor={bg} paddingHorizontal="$5" paddingVertical="$4">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} letterSpacing={4} color={fg}>
            ZER0
          </Text>
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} textTransform="uppercase" color={fg}>
            ${escapeTemplate(appName)}
          </Text>
        </XStack>
        <Button
          chromeless
          backgroundColor="transparent"
          borderWidth={0}
          color={fg}
          fontFamily={FONT_BOLD}
          fontSize={FONT_SIZE}
          paddingHorizontal={0}
          paddingVertical={0}
          onPress={() => setOpen((prev) => !prev)}
        >
          Menu
        </Button>
      </XStack>
      {open ? (
        <YStack marginTop="$3" gap="$2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} asChild>
              <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} textDecorationLine="underline" color={fg}>
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
import { FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

export function SiteFooter() {
  const { bg, fg } = useThemeColors();

  return (
    <YStack backgroundColor={bg} paddingHorizontal="$5" paddingVertical="$4">
      <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
        ${escapeTemplate(domain) ? `Domain: ${escapeTemplate(domain)}` : 'Domain: not set'}
      </Text>
      <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
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
import { FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

const envItems = ${envItems};

export function EnvList() {
  const { bg, fg } = useThemeColors();

  if (envItems.length === 0) {
    return (
      <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
        No environment variables required.
      </Text>
    );
  }

  return (
    <YStack gap="$3">
      {envItems.map((item) => (
        <YStack key={item.key} gap="$2">
          <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>{item.description}</Text>
          <Text
            fontFamily={FONT_REGULAR}
            fontSize={FONT_SIZE}
            backgroundColor={fg}
            color={bg}
            paddingHorizontal="$2"
            paddingVertical="$1"
          >
            {item.key}
          </Text>
          {item.url ? (
            <Text
              fontFamily={FONT_REGULAR}
              fontSize={FONT_SIZE}
              textDecorationLine="underline"
              color={fg}
              onPress={() => Linking.openURL(item.url)}
            >
              Get keys
            </Text>
          ) : null}
        </YStack>
      ))}
    </YStack>
  );
}
`;
}

function expoConnectionGuideTemplate(connectionItems: string): string {
  return `import { Linking } from 'react-native';
import { Text, YStack } from 'tamagui';
import { FONT_BOLD, FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

const connections = ${connectionItems};

export function ConnectionGuide() {
  const { fg } = useThemeColors();

  if (connections.length === 0) {
    return null;
  }

  return (
    <YStack gap="$3">
      <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
        Connection guide
      </Text>
      {connections.map((item) => (
        <YStack key={item.label} gap="$1">
          <Text
            fontFamily={FONT_BOLD}
            fontSize={FONT_SIZE}
            color={fg}
            textDecorationLine="underline"
            onPress={() => Linking.openURL(item.url)}
          >
            {item.label}
          </Text>
          <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
            or go to{' '}
            <Text
              fontFamily={FONT_REGULAR}
              fontSize={FONT_SIZE}
              color={fg}
              textDecorationLine="underline"
              onPress={() => Linking.openURL(item.url)}
            >
              {item.url}
            </Text>{' '}
            directly.
          </Text>
        </YStack>
      ))}
    </YStack>
  );
}
`;
}

function expoContactFormTemplate(): string {
  return `import { useState } from 'react';
import { TextInput } from 'react-native';
import { Button, Text, YStack } from 'tamagui';
import { FONT_BOLD, FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

const CONTACT_ENDPOINT = process.env.EXPO_PUBLIC_CONTACT_ENDPOINT?.trim() ?? '';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const { fg } = useThemeColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const inputStyle = {
    borderBottomWidth: 1,
    borderBottomColor: fg,
    paddingVertical: 6,
    fontFamily: FONT_REGULAR,
    fontSize: FONT_SIZE,
    color: fg
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      setError('All fields are required.');
      return;
    }

    if (!CONTACT_ENDPOINT) {
      setStatus('error');
      setError('Set EXPO_PUBLIC_CONTACT_ENDPOINT.');
      return;
    }

    setStatus('sending');
    setError('');

    let sent = false;
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        })
      });
      sent = response.ok;
    } catch {
      sent = false;
    }

    if (!sent) {
      setStatus('error');
      setError('Unable to send message.');
      return;
    }

    setStatus('sent');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <YStack gap=\"$3\">
      <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
        Contact
      </Text>
      <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
        Send a quick note to your inbox.
      </Text>
      <YStack gap=\"$3\">
        <YStack gap=\"$1\">
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
            Name
          </Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </YStack>
        <YStack gap=\"$1\">
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
            Email
          </Text>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        </YStack>
        <YStack gap=\"$1\">
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
            Message
          </Text>
          <TextInput
            style={{ ...inputStyle, minHeight: 96, textAlignVertical: 'top' }}
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </YStack>
      </YStack>
      <Button
        backgroundColor=\"transparent\"
        borderWidth={0}
        paddingHorizontal={0}
        paddingVertical={0}
        alignSelf=\"flex-start\"
        disabled={status === 'sending'}
        onPress={submit}
      >
        <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg} textDecorationLine=\"underline\">
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </Text>
      </Button>
      {status === 'sent' ? (
        <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
          Message sent.
        </Text>
      ) : null}
      {status === 'error' && error ? (
        <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
          {error}
        </Text>
      ) : null}
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
import { FONT_BOLD, FONT_REGULAR, FONT_SIZE, useThemeColors } from './theme';

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
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
        <YStack gap="$4">
          {badge ? (
            <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} textTransform="uppercase" letterSpacing={2} color={fg}>
              {badge}
            </Text>
          ) : null}
          <Text fontFamily={FONT_BOLD} fontSize={FONT_SIZE} color={fg}>
            {title}
          </Text>
          <Text fontFamily={FONT_REGULAR} fontSize={FONT_SIZE} color={fg}>
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
    const url = item.url ? `'${escapeTemplate(item.url)}'` : 'undefined';
    return `{
      key: '${escapeTemplate(item.key)}',
      description: '${escapeTemplate(item.description)}',
      url: ${url}
    }`;
  });
  return `[
    ${items.join(',\n    ')}
  ]`;
}

function renderConnectionItems(connections: ModuleConnection[]): string {
  if (connections.length === 0) {
    return '[]';
  }
  const items = connections.map((item) => {
    return `{
      label: '${escapeTemplate(item.label)}',
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
