const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targets = [
  { os: 'darwin', arch: 'arm64', name: 'darwin-arm64' },
  { os: 'darwin', arch: 'amd64', name: 'darwin-amd64' },
  { os: 'linux', arch: 'amd64', name: 'linux-amd64' },
  { os: 'linux', arch: 'arm64', name: 'linux-arm64' },
  { os: 'windows', arch: 'amd64', name: 'windows-amd64', ext: '.exe' }
];

const root = process.cwd();
const binDir = path.join(root, 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

for (const target of targets) {
  const output = path.join(binDir, `zero-${target.name}${target.ext || ''}`);
  const env = {
    ...process.env,
    GOOS: target.os,
    GOARCH: target.arch,
    CGO_ENABLED: '0'
  };

  const result = spawnSync('go', ['build', '-o', output, './'], {
    cwd: path.join(root, 'tui'),
    env,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
