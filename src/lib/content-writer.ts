import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, extname } from 'node:path';

const REPO_ROOT = process.cwd();

export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const ext     = extname(file.name) || '.jpg';
  const slug    = slugify(file.name.replace(/\.[^.]+$/, ''));
  const filename = `${slug}-${Date.now()}${ext}`;
  const dir      = join(REPO_ROOT, 'public', 'uploads', folder);
  const filePath = join(dir, filename);

  mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filePath, buffer);

  return `/uploads/${folder}/${filename}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toMdxFrontmatter(data: Record<string, any>): string {
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

export function savePerson(data: Record<string, any>, editor: string): string {
  const slug = data.existingSlug || slugify(data.name);
  const frontmatter = toMdxFrontmatter({
    name:       data.name,
    branch:     data.branch,
    generation: data.generation,
    born:       data.born       || null,
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
  const filePath = join(REPO_ROOT, 'src', 'content', 'people', `${slug}.md`);

  writeFileSync(filePath, content, 'utf-8');
  gitCommit(`src/content/people/${slug}.md`, `[${editor}] Guardó persona: ${data.name}`);

  return slug;
}

export function deletePerson(slug: string, editor: string): void {
  const filePath = join(REPO_ROOT, 'src', 'content', 'people', `${slug}.md`);
  unlinkSync(filePath);
  gitCommitDelete(`src/content/people/${slug}.md`, `[${editor}] Eliminó persona: ${slug}`);
}

export function saveStory(data: Record<string, any>, editor: string): string {
  const slug = data.existingSlug || slugify(data.title);
  const frontmatter = toMdxFrontmatter({
    title:         data.title,
    branch:        data.branch,
    date:          data.date,
    author:        data.author        || null,
    featuredImage: data.featuredImage || null,
    relatedPeople: data.relatedPeople || [],
  });

  const body    = data.body ? `\n${data.body}\n` : '';
  const content = `${frontmatter}\n${body}`;
  const filePath = join(REPO_ROOT, 'src', 'content', 'stories', `${slug}.md`);

  writeFileSync(filePath, content, 'utf-8');
  gitCommit(`src/content/stories/${slug}.md`, `[${editor}] Guardó historia: ${data.title}`);

  return slug;
}

export function deleteStory(slug: string, editor: string): void {
  const filePath = join(REPO_ROOT, 'src', 'content', 'stories', `${slug}.md`);
  unlinkSync(filePath);
  gitCommitDelete(`src/content/stories/${slug}.md`, `[${editor}] Eliminó historia: ${slug}`);
}

function gitCommit(filePath: string, message: string): void {
  try {
    execSync(`git add "${filePath}"`, { cwd: REPO_ROOT });
    execSync(`git commit -m "${message}"`, { cwd: REPO_ROOT });
  } catch (e) {
    // In local dev git may not be configured — fail silently
    console.warn('Git commit skipped:', e);
  }
}

function gitCommitDelete(filePath: string, message: string): void {
  try {
    execSync(`git rm "${filePath}"`, { cwd: REPO_ROOT });
    execSync(`git commit -m "${message}"`, { cwd: REPO_ROOT });
  } catch (e) {
    console.warn('Git commit skipped:', e);
  }
}
