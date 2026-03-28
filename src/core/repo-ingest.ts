import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export interface RepoIngestResult {
  url: string;
  repo?: string;
  cloneDir?: string;
  topLevelEntries: string[];
  keyFiles: string[];
  entrypoints: RepoEntrypoint[];
  packageName?: string;
  packageVersion?: string;
  packageDescription?: string;
  readmeSnippet?: string;
  archetype: 'app' | 'library' | 'tooling' | 'config-pack' | 'demo' | 'unknown';
}

export interface RepoEntrypoint {
  path: string;
  snippet: string;
}

export function ingestRepositoryFromText(input: string): RepoIngestResult | undefined {
  const url = extractGitHubUrl(input);
  if (!url) {
    return undefined;
  }

  const repo = extractOwnerRepo(url);
  const cloneDir = path.join(os.tmpdir(), `lobster-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);

  try {
    execFileSync('git', ['clone', '--depth=1', url, cloneDir], {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch {
    return {
      url,
      repo,
      cloneDir: undefined,
      topLevelEntries: [],
      keyFiles: [],
      entrypoints: [],
      archetype: 'unknown',
    };
  }

  const topLevelEntries = safeReadDir(cloneDir);
  const keyFiles = detectKeyFiles(cloneDir);
  const packageInfo = readPackageJson(cloneDir);
  const readmeSnippet = readReadmeSnippet(cloneDir);
  const archetype = detectArchetype(topLevelEntries, keyFiles, readmeSnippet);
  const entrypoints = detectEntrypoints(cloneDir, archetype);

  return {
    url,
    repo,
    cloneDir,
    topLevelEntries,
    keyFiles,
    entrypoints,
    packageName: packageInfo?.name,
    packageVersion: packageInfo?.version,
    packageDescription: packageInfo?.description,
    readmeSnippet,
    archetype,
  };
}

function extractGitHubUrl(text: string): string | undefined {
  const match = text.match(/https:\/\/github\.com\/[^\s)]+/i);
  return match?.[0]?.replace(/\.git$/i, '');
}

function extractOwnerRepo(url: string): string | undefined {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/i);
  return match?.[1];
}

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
}

function detectKeyFiles(root: string): string[] {
  const candidates = [
    'README.md',
    'README',
    'package.json',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'tsconfig.json',
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'index.ts',
    'index.js',
    'main.py',
    'tests',
    'test',
    'docs',
    '.claude',
    '.claude/agents',
    '.claude/commands',
    '.claude/hooks',
  ];

  return candidates.filter((candidate) => fs.existsSync(path.join(root, candidate)));
}

function readPackageJson(root: string): { name?: string; version?: string; description?: string } | undefined {
  const file = path.join(root, 'package.json');
  if (!fs.existsSync(file)) {
    return undefined;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as { name?: string; version?: string; description?: string };
  } catch {
    return undefined;
  }
}

function readReadmeSnippet(root: string): string | undefined {
  const candidates = ['README.md', 'README'];
  for (const candidate of candidates) {
    const file = path.join(root, candidate);
    if (!fs.existsSync(file)) {
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    const cleaned = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*_`\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) {
      return cleaned.slice(0, 500);
    }
  }
  return undefined;
}

function detectArchetype(topLevelEntries: string[], keyFiles: string[], readmeSnippet?: string): RepoIngestResult['archetype'] {
  const joined = `${topLevelEntries.join(' ')} ${keyFiles.join(' ')} ${readmeSnippet ?? ''}`.toLowerCase();

  if (joined.includes('.claude') || joined.includes('hooks') || joined.includes('agents') || joined.includes('commands')) {
    return 'config-pack';
  }
  if (joined.includes('cli') || joined.includes('tool') || joined.includes('workflow')) {
    return 'tooling';
  }
  if (joined.includes('sdk') || joined.includes('library')) {
    return 'library';
  }
  if (joined.includes('demo') || joined.includes('example')) {
    return 'demo';
  }
  if (joined.includes('src') || joined.includes('app') || joined.includes('web') || joined.includes('server')) {
    return 'app';
  }
  return 'unknown';
}

function detectEntrypoints(root: string, archetype: RepoIngestResult['archetype']): RepoEntrypoint[] {
  const candidates = [
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'src/cli.ts',
    'src/cli.js',
    'index.ts',
    'index.js',
    'main.py',
    '.claude/commands/README.md',
    '.claude/commands',
    '.agents',
  ];

  if (archetype === 'config-pack') {
    candidates.unshift('.claude/commands', '.agents');
  }

  const results: RepoEntrypoint[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (seen.has(candidate) || !fs.existsSync(fullPath)) {
      continue;
    }
    seen.add(candidate);

    if (fs.statSync(fullPath).isDirectory()) {
      const entries = safeReadDir(fullPath).slice(0, 8).join(', ');
      results.push({ path: candidate, snippet: `directory entries: ${entries}` });
    } else {
      const text = fs.readFileSync(fullPath, 'utf8').slice(0, 800);
      const cleaned = text.replace(/\s+/g, ' ').trim();
      results.push({ path: candidate, snippet: cleaned.slice(0, 280) });
    }

    if (results.length >= 3) {
      break;
    }
  }

  return results;
}
