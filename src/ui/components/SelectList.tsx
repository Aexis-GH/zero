import React, { useCallback, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SelectItem {
  id: string;
  label: string;
  description?: string;
}

interface SelectListProps {
  items: SelectItem[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  onSubmit: () => void;
  multi?: boolean;
  hint?: string;
}

export function SelectList({
  items,
  selectedIds,
  onChange,
  onSubmit,
  multi = false,
  hint
}: SelectListProps) {
  const [index, setIndex] = useState(0);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const move = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0) {
          return items.length - 1;
        }
        if (next >= items.length) {
          return 0;
        }
        return next;
      });
    },
    [items.length]
  );

  const toggle = useCallback(
    (itemId: string) => {
      if (multi) {
        const next = new Set(selectedSet);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        onChange(Array.from(next));
      } else {
        onChange([itemId]);
      }
    },
    [multi, onChange, selectedSet]
  );

  useInput((input, key) => {
    if (key.upArrow) {
      move(-1);
      return;
    }
    if (key.downArrow) {
      move(1);
      return;
    }
    if (input === ' ') {
      const item = items[index];
      if (item) {
        toggle(item.id);
      }
      return;
    }
    if (key.return) {
      onSubmit();
    }
  });

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {items.map((item, idx) => {
          const isSelected = selectedSet.has(item.id);
          const isActive = idx === index;
          const prefix = isActive ? '>' : ' ';
          const marker = multi
            ? isSelected
              ? '[x]'
              : '[ ]'
            : isSelected
              ? '(x)'
              : '( )';
          return (
            <Box key={item.id} flexDirection="column">
              <Text color={isActive ? 'cyan' : undefined}>
                {prefix} {marker} {item.label}
              </Text>
              {item.description ? (
                <Text color="gray">  {item.description}</Text>
              ) : null}
            </Box>
          );
        })}
      </Box>
      {hint ? <Text color="gray">{hint}</Text> : null}
    </Box>
  );
}
