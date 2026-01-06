import React from 'react';
import { Box, Text } from 'ink';
import { SelectList, SelectItem } from '../components/SelectList.js';
import { frameworks } from '../../config/frameworks.js';
import type { FrameworkId } from '../../types.js';

interface FrameworkSelectProps {
  value: FrameworkId;
  onChange: (value: FrameworkId) => void;
  onConfirm: () => void;
}

export function FrameworkSelect({ value, onChange, onConfirm }: FrameworkSelectProps) {
  const items: SelectItem[] = frameworks.map((framework) => ({
    id: framework.id,
    label: framework.label,
    description: framework.description
  }));

  return (
    <Box flexDirection="column">
      <Text color="cyan">Framework</Text>
      <Text color="gray">Use arrows to move, space to select, Enter to confirm.</Text>
      <SelectList
        items={items}
        selectedIds={[value]}
        onChange={(next) => onChange(next[0] as FrameworkId)}
        onSubmit={onConfirm}
        multi={false}
        hint="( ) radio select"
      />
    </Box>
  );
}
