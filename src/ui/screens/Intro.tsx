import React from 'react';
import { Box, Text, useInput } from 'ink';

interface IntroProps {
  onContinue: () => void;
}

const introArt = [
  '   _____',
  '  / ___ \\ ',
  ' / / _ \\ \\ ',
  ' | |/ /| |',
  ' \\ \\_/ / /',
  '  \\___/_/'
].join('\n');

export function Intro({ onContinue }: IntroProps) {
  useInput((input, key) => {
    if (key.return || input === ' ') {
      onContinue();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{introArt}</Text>
      <Text color="cyan">Aexis Zero</Text>
      <Text color="gray">Press Enter to begin.</Text>
    </Box>
  );
}
