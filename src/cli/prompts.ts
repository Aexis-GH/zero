import * as p from '@clack/prompts';
import { frameworks } from '../config/frameworks.js';
import { modules } from '../config/modules.js';
import type { FrameworkId, ModuleId, ProjectConfig } from '../types.js';

const introArt = [
  '   _____',
  '  / ___ \\\\',
  ' / / _ \\\\ \\\\',
  ' | |/ /| |',
  ' \\\\ \\\\_/ / /',
  '  \\\\___/_/'
].join('\n');

type Step = 'directory' | 'name' | 'domain' | 'framework' | 'modules' | 'confirm';

type ConfirmAction =
  | 'continue'
  | 'edit-directory'
  | 'edit-name'
  | 'edit-domain'
  | 'edit-framework'
  | 'edit-modules'
  | 'cancel';

export async function runWizard(): Promise<ProjectConfig | null> {
  p.intro(`${introArt}\nAexis Zero`);

  let directory = '.';
  let appName = '';
  let domain = '';
  let framework: FrameworkId = 'nextjs';
  let selectedModules: ModuleId[] = [];

  let step: Step = 'directory';

  while (true) {
    if (step === 'directory') {
      const value = await p.text({
        message: 'Project directory',
        placeholder: '.',
        validate: (input) => {
          if (typeof input !== 'string') {
            return 'Enter a directory.';
          }
          return undefined;
        }
      });
      if (isCancelled(value)) return null;
      const normalized = String(value).trim();
      directory = normalized.length === 0 ? '.' : normalized;
      step = 'name';
      continue;
    }

    if (step === 'name') {
      const value = await p.text({
        message: 'App name',
        placeholder: 'my-app',
        validate: (input) => {
          if (typeof input !== 'string' || input.trim().length === 0) {
            return 'App name is required.';
          }
          return undefined;
        }
      });
      if (isCancelled(value)) return null;
      appName = String(value).trim();
      step = 'domain';
      continue;
    }

    if (step === 'domain') {
      const value = await p.text({
        message: 'Domain (optional)',
        placeholder: 'example.com'
      });
      if (isCancelled(value)) return null;
      domain = String(value).trim();
      step = 'framework';
      continue;
    }

    if (step === 'framework') {
      const value = await p.select({
        message: 'Framework',
        options: frameworks.map((item) => ({
          value: item.id,
          label: item.label,
          hint: item.description
        }))
      });
      if (isCancelled(value)) return null;
      framework = value as FrameworkId;
      step = 'modules';
      continue;
    }

    if (step === 'modules') {
      const value = await p.multiselect({
        message: 'Modules',
        options: modules.map((item) => ({
          value: item.id,
          label: item.label,
          hint: item.description
        })),
        required: false
      });
      if (isCancelled(value)) return null;
      selectedModules = value as ModuleId[];
      step = 'confirm';
      continue;
    }

    if (step === 'confirm') {
      const frameworkLabel = frameworks.find((item) => item.id === framework)?.label ?? framework;
      const moduleLabels = selectedModules
        .map((id) => modules.find((item) => item.id === id)?.label ?? id)
        .join(', ');

      p.note(
        [
          `Directory: ${directory}`,
          `App name: ${appName}`,
          `Domain: ${domain || 'None'}`,
          `Framework: ${frameworkLabel}`,
          `Modules: ${moduleLabels || 'None'}`
        ].join('\n'),
        'Review'
      );

      const action = await p.select({
        message: 'Next step',
        options: [
          { value: 'continue', label: 'Continue' },
          { value: 'edit-directory', label: 'Edit directory' },
          { value: 'edit-name', label: 'Edit name' },
          { value: 'edit-domain', label: 'Edit domain' },
          { value: 'edit-framework', label: 'Edit framework' },
          { value: 'edit-modules', label: 'Edit modules' },
          { value: 'cancel', label: 'Cancel' }
        ]
      });
      if (isCancelled(action)) return null;

      switch (action as ConfirmAction) {
        case 'continue':
          return {
            directory,
            appName,
            domain,
            framework,
            modules: selectedModules
          };
        case 'edit-directory':
          step = 'directory';
          continue;
        case 'edit-name':
          step = 'name';
          continue;
        case 'edit-domain':
          step = 'domain';
          continue;
        case 'edit-framework':
          step = 'framework';
          continue;
        case 'edit-modules':
          step = 'modules';
          continue;
        case 'cancel':
          p.cancel('Cancelled.');
          return null;
        default:
          return null;
      }
    }
  }
}

function isCancelled(value: unknown): boolean {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    return true;
  }
  return false;
}
