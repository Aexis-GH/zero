import React from 'react';
import { Box, Text } from 'ink';
import { SelectList, SelectItem } from '../components/SelectList.js';
import { modules } from '../../config/modules.js';
import type { ModuleId } from '../../types.js';

interface ModuleSelectProps {
  value: ModuleId[];
  onChange: (value: ModuleId[]) => void;
  onConfirm: () => void;
}

export function ModuleSelect({ value, onChange, onConfirm }: ModuleSelectProps) {
  const items: SelectItem[] = modules.map((module) => ({
    id: module.id,
    label: module.label,
    description: module.description
  }));

  return (
    <Box flexDirection="column">
      <Text color="cyan">Modules</Text>
      <Text color="gray">Use arrows to move, space to toggle, Enter to confirm.</Text>
      <SelectList
        items={items}
        selectedIds={value}
        onChange={(next) => onChange(next as ModuleId[])}
        onSubmit={onConfirm}
        multi
        hint="[ ] multi-select"
      />
    </Box>
  );
}
