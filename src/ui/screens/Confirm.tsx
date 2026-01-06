import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectList, SelectItem } from '../components/SelectList.js';
import { frameworks } from '../../config/frameworks.js';
import { modules } from '../../config/modules.js';
import type { FrameworkId, ModuleId } from '../../types.js';

export type ConfirmAction =
  | 'continue'
  | 'edit-name'
  | 'edit-domain'
  | 'edit-framework'
  | 'edit-modules'
  | 'cancel';

interface ConfirmProps {
  name: string;
  domain: string;
  framework: FrameworkId;
  modules: ModuleId[];
  onAction: (action: ConfirmAction) => void;
}

const actionItems: SelectItem[] = [
  { id: 'continue', label: 'Continue' },
  { id: 'edit-name', label: 'Edit name' },
  { id: 'edit-domain', label: 'Edit domain' },
  { id: 'edit-framework', label: 'Edit framework' },
  { id: 'edit-modules', label: 'Edit modules' },
  { id: 'cancel', label: 'Cancel' }
];

export function Confirm({ name, domain, framework, modules: selectedModules, onAction }: ConfirmProps) {
  const [selection, setSelection] = useState<ConfirmAction>('continue');

  const frameworkLabel = frameworks.find((item) => item.id === framework)?.label ?? framework;
  const moduleLabels = selectedModules
    .map((id) => modules.find((item) => item.id === id)?.label ?? id)
    .join(', ');

  return (
    <Box flexDirection="column">
      <Text color="cyan">Confirm</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>App name: {name}</Text>
        <Text>Domain: {domain || 'None'}</Text>
        <Text>Framework: {frameworkLabel}</Text>
        <Text>Modules: {moduleLabels || 'None'}</Text>
      </Box>
      <Box marginTop={1}>
        <SelectList
          items={actionItems}
          selectedIds={[selection]}
          onChange={(next) => setSelection(next[0] as ConfirmAction)}
          onSubmit={() => onAction(selection)}
          multi={false}
          hint="Select an action and press Enter."
        />
      </Box>
    </Box>
  );
}
