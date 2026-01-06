import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface DomainPromptProps {
  initialValue: string;
  onSubmit: (value: string) => void;
}

export function DomainPrompt({ initialValue, onSubmit }: DomainPromptProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    onSubmit(value.trim());
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan">Domain (optional)</Text>
      <Text color="gray">Press Enter to continue or leave blank.</Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="example.com"
      />
    </Box>
  );
}
