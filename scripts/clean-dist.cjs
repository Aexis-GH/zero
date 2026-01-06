const fs = require('fs');
const path = require('path');

const distPath = path.join(process.cwd(), 'dist');
try {
  fs.rmSync(distPath, { recursive: true, force: true });
} catch {
  // ignore
}
