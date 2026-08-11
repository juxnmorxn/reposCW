const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-brand-50': 'bg-brand-50 dark:bg-brand-900/30',
  'bg-rose-50': 'bg-rose-50 dark:bg-rose-900/30',
  'bg-amber-50': 'bg-amber-50 dark:bg-amber-900/30',
  'bg-violet-50': 'bg-violet-50 dark:bg-violet-900/30',
  'shadow-card': 'shadow-card dark:shadow-none',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [search, replace] of Object.entries(replacements)) {
    const regex = new RegExp(`(?<!dark:)\\b${search}\\b(?!\\s+dark:)`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src/components'));
walkDir(path.join(__dirname, 'src/app'));
