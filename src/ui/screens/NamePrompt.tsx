import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface NamePromptProps {
  initialValue: string;
  onSubmit: (value: string) => void;
}

export function NamePrompt({ initialValue, onSubmit }: NamePromptProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('App name is required.');
      return;
    }
    setError('');
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan">App name</Text>
      <Text color="gray">Required. Press Enter to continue.</Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="my-app"
      />
      {error ? <Text color="red">{error}</Text> : null}
    </Box>
  );
}
