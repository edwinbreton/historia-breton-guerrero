import { execSync } from 'node:child_process';

const REPO_ROOT  = process.cwd();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER   = 'edwinbreton';
const REPO_NAME    = 'historia-breton-guerrero';
const BRANCH       = 'main';

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toFrontmatter(data: Record<string, any>): string {
  const lines: string[] = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      value.forEach(item => {
        if (typeof item === 'object') {
          lines.push(`  -`);
          for (const [k, v] of Object.entries(item)) {
            if (v) lines.push(`    ${k}: ${JSON.stringify(v)}`);
          }
        } else {
          lines.push(`  - ${JSON.stringify(item)}`);
        }
      });
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

const isNetlify = !!process.env.NETLIFY || !!GITHUB_TOKEN && !isLocal();

function isLocal(): boolean {
  try {
    const { writeFileSync } = require('node:fs');
    writeFileSync('/tmp/bg-test', '');
    return true;
  } catch {
    return false;
  }
}

// ── GitHub API ────────────────────────────────────────────────────────────────

async function githubWrite(path: string, content: string, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

  // Get existing file SHA if it exists (needed for updates)
  let sha: string | undefined;
  const getRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (getRes.ok) {
    const existing = await getRes.json() as { sha: string };
    sha = existing.sha;
  }

  const body: Record<string, any> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch:  BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method:  'PUT',
    headers: {
      Authorization:  `Bearer ${GITHUB_TOKEN}`,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
}

async function githubDelete(path: string, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

  const getRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!getRes.ok) return; // already gone

  const existing = await getRes.json() as { sha: string };

  const res = await fetch(url, {
    method:  'DELETE',
    headers: {
      Authorization:  `Bearer ${GITHUB_TOKEN}`,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sha: existing.sha, branch: BRANCH }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API delete error: ${res.status} ${err}`);
  }
}

// ── Local filesystem ──────────────────────────────────────────────────────────

function localWrite(filePath: string, content: string, message: string): void {
  const { writeFileSync, mkdirSync } = require('node:fs');
  const { dirname } = require('node:path');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  try {
    execSync(`git add "${filePath}"`, { cwd: REPO_ROOT });
    execSync(`git commit -m "${message}"`, { cwd: REPO_ROOT });
  } catch {
    // silently skip in dev
  }
}

function localDelete(filePath: string, message: string): void {
  const { unlinkSync } = require('node:fs');
  try { unlinkSync(filePath); } catch {}
  try {
    execSync(`git rm "${filePath}"`, { cwd: REPO_ROOT });
    execSync(`git commit -m "${message}"`, { cwd: REPO_ROOT });
  } catch {}
}

// ── File upload ───────────────────────────────────────────────────────────────

export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const ext      = (file.name.match(/\.[^.]+$/) ?? ['.jpg'])[0];
  const slug     = slugify(file.name.replace(/\.[^.]+$/, ''));
  const filename = `${slug}-${Date.now()}${ext}`;
  const repoPath = `public/uploads/${folder}/${filename}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  if (GITHUB_TOKEN) {
    // Binary files must be sent as raw base64 — use buffer directly
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${repoPath}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${GITHUB_TOKEN}`,
        Accept:         'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `[upload] ${filename}`,
        content: buffer.toString('base64'),
        branch:  BRANCH,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub upload error: ${res.status} ${err}`);
    }
  } else {
    const { join } = require('node:path');
    const { writeFileSync, mkdirSync } = require('node:fs');
    const dir = join(REPO_ROOT, 'public', 'uploads', folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), buffer);
  }

  return `/uploads/${folder}/${filename}`;
}

// ── Person ────────────────────────────────────────────────────────────────────

export async function savePerson(data: Record<string, any>, editor: string): Promise<string> {
  const slug = data.existingSlug || slugify(data.name);
  const frontmatter = toFrontmatter({
    name:       data.name,
    branch:     data.branch,
    generation: data.generation,
    born:       data.born       || null,
    deceased:   data.deceased   || null,
    died:       data.died       || null,
    birthplace: data.birthplace || null,
    occupation: data.occupation || null,
    portrait:   data.portrait   || null,
    parents:    data.parents    || [],
    children:   data.children   || [],
    spouses:    data.spouses    || [],
  });

  const body    = data.bio ? `\n${data.bio}\n` : '';
  const content = `${frontmatter}\n${body}`;
  const repoPath = `src/content/people/${slug}.md`;
  const message  = `[${editor}] Guardó persona: ${data.name}`;

  if (GITHUB_TOKEN) {
    await githubWrite(repoPath, content, message);
  } else {
    const { join } = require('node:path');
    localWrite(join(REPO_ROOT, repoPath), content, message);
  }

  return slug;
}

export async function deletePerson(slug: string, editor: string): Promise<void> {
  const repoPath = `src/content/people/${slug}.md`;
  const message  = `[${editor}] Eliminó persona: ${slug}`;

  if (GITHUB_TOKEN) {
    await githubDelete(repoPath, message);
  } else {
    const { join } = require('node:path');
    localDelete(join(REPO_ROOT, repoPath), message);
  }
}

// ── Story ─────────────────────────────────────────────────────────────────────

export async function saveStory(data: Record<string, any>, editor: string): Promise<string> {
  const slug = data.existingSlug || slugify(data.title);
  const frontmatter = toFrontmatter({
    title:         data.title,
    branch:        data.branch,
    date:          data.date,
    author:        data.author        || null,
    featuredImage: data.featuredImage || null,
    relatedPeople: data.relatedPeople || [],
  });

  const body    = data.body ? `\n${data.body}\n` : '';
  const content = `${frontmatter}\n${body}`;
  const repoPath = `src/content/stories/${slug}.md`;
  const message  = `[${editor}] Guardó historia: ${data.title}`;

  if (GITHUB_TOKEN) {
    await githubWrite(repoPath, content, message);
  } else {
    const { join } = require('node:path');
    localWrite(join(REPO_ROOT, repoPath), content, message);
  }

  return slug;
}

export async function deleteStory(slug: string, editor: string): Promise<void> {
  const repoPath = `src/content/stories/${slug}.md`;
  const message  = `[${editor}] Eliminó historia: ${slug}`;

  if (GITHUB_TOKEN) {
    await githubDelete(repoPath, message);
  } else {
    const { join } = require('node:path');
    localDelete(join(REPO_ROOT, repoPath), message);
  }
}
