import React, { useCallback, useRef, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import type { FrameworkId, ModuleId, ProjectConfig } from '../types.js';
import { Intro } from './screens/Intro.js';
import { NamePrompt } from './screens/NamePrompt.js';
import { DomainPrompt } from './screens/DomainPrompt.js';
import { FrameworkSelect } from './screens/FrameworkSelect.js';
import { ModuleSelect } from './screens/ModuleSelect.js';
import { Confirm, ConfirmAction } from './screens/Confirm.js';

export type Step = 'intro' | 'name' | 'domain' | 'framework' | 'modules' | 'confirm';

interface AppProps {
  onComplete: (config: ProjectConfig | null) => void;
}

export function App({ onComplete }: AppProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [resumeStep, setResumeStep] = useState<Step | null>(null);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [framework, setFramework] = useState<FrameworkId>('nextjs');
  const [modules, setModules] = useState<ModuleId[]>([]);
  const completedRef = useRef(false);

  const finish = useCallback(
    (config: ProjectConfig | null) => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      onComplete(config);
      exit();
    },
    [exit, onComplete]
  );

  const goNext = useCallback(
    (next: Step) => {
      if (resumeStep) {
        setStep(resumeStep);
        setResumeStep(null);
        return;
      }
      setStep(next);
    },
    [resumeStep]
  );

  const handleConfirmAction = useCallback(
    (action: ConfirmAction) => {
      switch (action) {
        case 'continue':
          finish({
            appName: name,
            domain,
            framework,
            modules
          });
          return;
        case 'cancel':
          finish(null);
          return;
        case 'edit-name':
          setResumeStep('confirm');
          setStep('name');
          return;
        case 'edit-domain':
          setResumeStep('confirm');
          setStep('domain');
          return;
        case 'edit-framework':
          setResumeStep('confirm');
          setStep('framework');
          return;
        case 'edit-modules':
          setResumeStep('confirm');
          setStep('modules');
          return;
        default:
          return;
      }
    },
    [domain, finish, framework, modules, name]
  );

  return (
    <Box flexDirection="column">
      {step === 'intro' ? null : (
        <Text color="cyan">Aexis Zero</Text>
      )}
      {step === 'intro' ? (
        <Intro onContinue={() => setStep('name')} />
      ) : null}
      {step === 'name' ? (
        <NamePrompt
          initialValue={name}
          onSubmit={(value) => {
            setName(value);
            goNext('domain');
          }}
        />
      ) : null}
      {step === 'domain' ? (
        <DomainPrompt
          initialValue={domain}
          onSubmit={(value) => {
            setDomain(value);
            goNext('framework');
          }}
        />
      ) : null}
      {step === 'framework' ? (
        <FrameworkSelect
          value={framework}
          onChange={setFramework}
          onConfirm={() => goNext('modules')}
        />
      ) : null}
      {step === 'modules' ? (
        <ModuleSelect
          value={modules}
          onChange={setModules}
          onConfirm={() => goNext('confirm')}
        />
      ) : null}
      {step === 'confirm' ? (
        <Confirm
          name={name}
          domain={domain}
          framework={framework}
          modules={modules}
          onAction={handleConfirmAction}
        />
      ) : null}
    </Box>
  );
}
