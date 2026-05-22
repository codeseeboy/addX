import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '..', 'web-dist');
const marker = path.join(out, '.nojekyll');
if (fs.existsSync(out)) {
  fs.writeFileSync(marker, '');
  console.log('[export:web] wrote', marker, '(GitHub Pages: keep _expo/)');
} else {
  console.warn('[export:web] web-dist missing, skip .nojekyll');
}
