import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, extname } from 'node:path';

const REPO_ROOT    = process.cwd();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER   = 'edwinbreton';
const REPO_NAME    = 'historia-breton-guerrero';
const BRANCH       = 'main';

// Draft paths (staged but not yet published)
const DRAFT_PEOPLE_PATH  = 'drafts/people';
const DRAFT_STORIES_PATH = 'drafts/stories';
const LIVE_PEOPLE_PATH   = 'src/content/people';
const LIVE_STORIES_PATH  = 'src/content/stories';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── GitHub API ────────────────────────────────────────────────────────────────

async function githubWrite(path: string, content: string, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

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
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${err}`);
  }
}

async function githubWriteBinary(path: string, buffer: Buffer, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

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
    content: buffer.toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API upload error ${res.status}: ${err}`);
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
  if (!getRes.ok) return;

  const existing = await getRes.json() as { sha: string };

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sha: existing.sha, branch: BRANCH }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API delete error ${res.status}: ${err}`);
  }
}

// ── Local filesystem ──────────────────────────────────────────────────────────

function localWrite(filePath: string, content: string, message: string): void {
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
    await githubWriteBinary(repoPath, buffer, `[upload] ${filename}`);
  } else {
    const dir = join(REPO_ROOT, 'public', 'uploads', folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), buffer);
  }

  return `/uploads/${folder}/${filename}`;
}

// ── Draft listing ─────────────────────────────────────────────────────────────

export interface DraftEntry {
  slug: string;
  type: 'person' | 'story';
  path: string;
}

export async function listDrafts(): Promise<DraftEntry[]> {
  const drafts: DraftEntry[] = [];

  if (GITHUB_TOKEN) {
    for (const [type, draftPath] of [['person', DRAFT_PEOPLE_PATH], ['story', DRAFT_STORIES_PATH]] as const) {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${draftPath}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) continue;
      const files = await res.json() as Array<{ name: string; path: string }>;
      for (const file of files) {
        if (file.name.endsWith('.md')) {
          drafts.push({ slug: file.name.replace('.md', ''), type, path: file.path });
        }
      }
    }
  } else {
    // Local — read from filesystem
    const { readdirSync, existsSync } = await import('node:fs');
    for (const [type, draftPath] of [['person', DRAFT_PEOPLE_PATH], ['story', DRAFT_STORIES_PATH]] as const) {
      const dir = join(REPO_ROOT, draftPath);
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir)) {
        if (file.endsWith('.md')) {
          drafts.push({ slug: file.replace('.md', ''), type, path: `${draftPath}/${file}` });
        }
      }
    }
  }

  return drafts;
}

// ── Publish all drafts ────────────────────────────────────────────────────────

export async function publishDrafts(editor: string): Promise<number> {
  const drafts = await listDrafts();
  if (drafts.length === 0) return 0;

  if (GITHUB_TOKEN) {
    // Fetch each draft's content and write to live path via GitHub API
    for (const draft of drafts) {
      const livePath = draft.type === 'person'
        ? `${LIVE_PEOPLE_PATH}/${draft.slug}.md`
        : `${LIVE_STORIES_PATH}/${draft.slug}.md`;

      // Get draft content
      const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${draft.path}`;
      const getRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
      });
      if (!getRes.ok) continue;
      const fileData = await getRes.json() as { content: string; sha: string };
      const content  = Buffer.from(fileData.content, 'base64').toString('utf-8');

      // Write to live path
      await githubWrite(livePath, content, `[${editor}] Publicó ${draft.type === 'person' ? 'persona' : 'historia'}: ${draft.slug}`);

      // Delete draft
      await githubDelete(draft.path, `[${editor}] Eliminó borrador: ${draft.slug}`);
    }
  } else {
    // Local — move files
    const { readFileSync, renameSync, mkdirSync } = await import('node:fs');
    for (const draft of drafts) {
      const srcPath  = join(REPO_ROOT, draft.path);
      const livePath = draft.type === 'person'
        ? join(REPO_ROOT, LIVE_PEOPLE_PATH, `${draft.slug}.md`)
        : join(REPO_ROOT, LIVE_STORIES_PATH, `${draft.slug}.md`);
      mkdirSync(dirname(livePath), { recursive: true });
      renameSync(srcPath, livePath);
    }
    try {
      execSync(`git add -A`, { cwd: REPO_ROOT });
      execSync(`git commit -m "[${editor}] Publicó ${drafts.length} cambio(s)"`, { cwd: REPO_ROOT });
    } catch {}
  }

  return drafts.length;
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

  const body      = data.bio ? `\n${data.bio}\n` : '';
  const content   = `${frontmatter}\n${body}`;
  const draftPath = `${DRAFT_PEOPLE_PATH}/${slug}.md`;
  const message   = `[${editor}] Guardó borrador de persona: ${data.name}`;

  if (GITHUB_TOKEN) {
    await githubWrite(draftPath, content, message);
  } else {
    localWrite(join(REPO_ROOT, draftPath), content, message);
  }

  return slug;
}

export async function deletePerson(slug: string, editor: string): Promise<void> {
  // Try to delete from drafts first, then from live
  const draftPath = `${DRAFT_PEOPLE_PATH}/${slug}.md`;
  const livePath  = `${LIVE_PEOPLE_PATH}/${slug}.md`;
  const message   = `[${editor}] Eliminó persona: ${slug}`;

  if (GITHUB_TOKEN) {
    // Try draft first
    const draftRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${draftPath}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    );
    if (draftRes.ok) {
      await githubDelete(draftPath, message);
    } else {
      await githubDelete(livePath, message);
    }
  } else {
    const { existsSync } = await import('node:fs');
    if (existsSync(join(REPO_ROOT, draftPath))) {
      localDelete(join(REPO_ROOT, draftPath), message);
    } else {
      localDelete(join(REPO_ROOT, livePath), message);
    }
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

  const body      = data.body ? `\n${data.body}\n` : '';
  const content   = `${frontmatter}\n${body}`;
  const draftPath = `${DRAFT_STORIES_PATH}/${slug}.md`;
  const message   = `[${editor}] Guardó borrador de historia: ${data.title}`;

  if (GITHUB_TOKEN) {
    await githubWrite(draftPath, content, message);
  } else {
    localWrite(join(REPO_ROOT, draftPath), content, message);
  }

  return slug;
}

export async function deleteStory(slug: string, editor: string): Promise<void> {
  const draftPath = `${DRAFT_STORIES_PATH}/${slug}.md`;
  const livePath  = `${LIVE_STORIES_PATH}/${slug}.md`;
  const message   = `[${editor}] Eliminó historia: ${slug}`;

  if (GITHUB_TOKEN) {
    const draftRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${draftPath}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    );
    if (draftRes.ok) {
      await githubDelete(draftPath, message);
    } else {
      await githubDelete(livePath, message);
    }
  } else {
    const { existsSync } = await import('node:fs');
    if (existsSync(join(REPO_ROOT, draftPath))) {
      localDelete(join(REPO_ROOT, draftPath), message);
    } else {
      localDelete(join(REPO_ROOT, livePath), message);
    }
  }
}
