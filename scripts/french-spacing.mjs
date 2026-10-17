// French typography for translated Markdown: a no-break space before ? ! : ;
// and %, and inside « », so punctuation never wraps onto its own line.
// Usage: node scripts/french-spacing.mjs [--check]
// --check exits non-zero if any file needs fixing, without writing.
import { readdir, readFile, writeFile } from 'node:fs/promises';

const DIRECTORIES = ['src/content/projects-fr', 'src/content/blog-fr'];
const NBSP = '\u00a0';
const check = process.argv.includes('--check');

/** Applies the spacing rules to prose, leaving inline code untouched. */
export function frenchSpacing(line) {
  return line
    .split(/(`[^`]*`)/)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part
        .replace(/ ([?!:;])(?=\s|$|["»)*_])/g, `${NBSP}$1`)
        .replace(/(\d) %/g, `$1${NBSP}%`)
        .replace(/« /g, `«${NBSP}`)
        .replace(/ »/g, `${NBSP}»`);
    })
    .join('');
}

function processMarkdown(source) {
  let inFence = false;
  let frontmatterFences = 0;
  return source
    .split('\n')
    .map((line) => {
      if (line === '---' && frontmatterFences < 2) {
        frontmatterFences += 1;
        return line;
      }
      // Frontmatter: only quoted values are prose; keys and comments stay as written.
      if (frontmatterFences === 1) {
        return line.replace(/^(\s*[\w-]+: ")(.*)("\s*)$/, (_, start, value, end) => start + frenchSpacing(value) + end);
      }
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : frenchSpacing(line);
    })
    .join('\n');
}

let changed = 0;
for (const directory of DIRECTORIES) {
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.md')) continue;
    const path = `${directory}/${name}`;
    const source = await readFile(path, 'utf8');
    const result = processMarkdown(source);
    if (result === source) continue;
    changed += 1;
    if (check) console.error(`needs French spacing: ${path}`);
    else await writeFile(path, result);
  }
}

if (check && changed) process.exit(1);
if (!check) console.log(`French spacing applied to ${changed} file(s).`);
