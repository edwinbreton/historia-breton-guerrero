/**
 * Seed script — generates a realistic fake family dataset for local testing.
 * Run with: node scripts/seed-test-data.mjs
 * Files go to src/content/people/ (gitignored, local only).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT  = join(ROOT, 'src', 'content', 'people');

mkdirSync(OUT, { recursive: true });

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function write(person) {
  const slug = slugify(person.name);
  const lines = ['---'];
  lines.push(`name: ${JSON.stringify(person.name)}`);
  if (person.gender) lines.push(`gender: ${JSON.stringify(person.gender)}`);
  lines.push(`branch: ${JSON.stringify(person.branch)}`);
  if (person.born)       lines.push(`born: ${JSON.stringify(person.born)}`);
  if (person.died)       lines.push(`died: ${JSON.stringify(person.died)}`);
  if (person.deceased)   lines.push(`deceased: true`);
  if (person.birthplace) lines.push(`birthplace: ${JSON.stringify(person.birthplace)}`);
  if (person.occupation) lines.push(`occupation: ${JSON.stringify(person.occupation)}`);
  if (person.parents?.length) {
    lines.push('parents:');
    person.parents.forEach(p => lines.push(`  - ${JSON.stringify(slugify(p))}`));
  }
  if (person.children?.length) {
    lines.push('children:');
    person.children.forEach(c => lines.push(`  - ${JSON.stringify(slugify(c))}`));
  }
  if (person.spouses?.length) {
    lines.push('spouses:');
    person.spouses.forEach(s => lines.push(`  - ${JSON.stringify(slugify(s))}`));
  }
  lines.push('---');
  if (person.bio) lines.push('', person.bio, '');

  const path = join(OUT, `${slug}.md`);
  writeFileSync(path, lines.join('\n'), 'utf-8');
  console.log(`✓ ${path}`);
  return slug;
}

// ── Generation 1 — Great-grandparents ────────────────────────────────────────

write({
  gender: 'M', name: 'Roberto Bretón Fuentes', branch: 'breton',
  born: '1918-03-12', died: '1985-07-04', deceased: true,
  birthplace: 'Sevilla, España', occupation: 'Agricultor',
  spouses: ['Carmen Díaz de Bretón'],
  children: ['Alfonso Bretón Díaz', 'Lucía Bretón Díaz'],
  bio: 'Emigró a República Dominicana en 1945 buscando nuevas oportunidades.',
});

write({
  gender: 'F', name: 'Carmen Díaz de Bretón', branch: 'breton',
  born: '1922-08-20', died: '1991-02-14', deceased: true,
  birthplace: 'Sevilla, España', occupation: 'Ama de casa',
  spouses: ['Roberto Bretón Fuentes'],
  children: ['Alfonso Bretón Díaz', 'Lucía Bretón Díaz'],
});

write({
  gender: 'M', name: 'Manuel Guerrero Reyes', branch: 'guerrero',
  born: '1920-11-05', died: '1988-09-30', deceased: true,
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Comerciante',
  spouses: ['Rosa Pérez de Guerrero'],
  children: ['Pedro Guerrero Pérez', 'Elena Guerrero Pérez'],
});

write({
  gender: 'F', name: 'Rosa Pérez de Guerrero', branch: 'guerrero',
  born: '1924-04-18', died: '2003-12-01', deceased: true,
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Maestra',
  spouses: ['Manuel Guerrero Reyes'],
  children: ['Pedro Guerrero Pérez', 'Elena Guerrero Pérez'],
  bio: 'Dedicó 40 años a la enseñanza primaria.',
});

// ── Generation 2 — Grandparents ───────────────────────────────────────────────

write({
  gender: 'M', name: 'Alfonso Bretón Díaz', branch: 'breton',
  born: '1945-06-10', died: '2010-03-22', deceased: true,
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Ingeniero',
  parents: ['Roberto Bretón Fuentes', 'Carmen Díaz de Bretón'],
  spouses: ['Elena Guerrero Pérez'],
  children: ['Carlos Bretón Guerrero', 'Sofía Bretón Guerrero'],
});

write({
  gender: 'F', name: 'Lucía Bretón Díaz', branch: 'breton',
  born: '1948-01-30',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Médica',
  parents: ['Roberto Bretón Fuentes', 'Carmen Díaz de Bretón'],
  spouses: ['Pedro Guerrero Pérez'],
  children: ['Marta Guerrero Bretón', 'Jorge Guerrero Bretón'],
});

write({
  gender: 'M', name: 'Pedro Guerrero Pérez', branch: 'guerrero',
  born: '1946-09-14', died: '2015-05-08', deceased: true,
  birthplace: 'Santiago, República Dominicana', occupation: 'Abogado',
  parents: ['Manuel Guerrero Reyes', 'Rosa Pérez de Guerrero'],
  spouses: ['Lucía Bretón Díaz'],
  children: ['Marta Guerrero Bretón', 'Jorge Guerrero Bretón'],
});

write({
  gender: 'F', name: 'Elena Guerrero Pérez', branch: 'guerrero',
  born: '1950-12-25',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Arquitecta',
  parents: ['Manuel Guerrero Reyes', 'Rosa Pérez de Guerrero'],
  spouses: ['Alfonso Bretón Díaz'],
  children: ['Carlos Bretón Guerrero', 'Sofía Bretón Guerrero'],
});

// ── Generation 3 — Parents ────────────────────────────────────────────────────

write({
  gender: 'M', name: 'Carlos Bretón Guerrero', branch: 'both',
  born: '1970-04-15',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Arquitecto',
  parents: ['Alfonso Bretón Díaz', 'Elena Guerrero Pérez'],
  spouses: ['Valeria Soto de Bretón'],
  children: ['Daniela Bretón Soto', 'Miguel Bretón Soto'],
});

write({
  gender: 'F', name: 'Sofía Bretón Guerrero', branch: 'both',
  born: '1973-08-02',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Psicóloga',
  parents: ['Alfonso Bretón Díaz', 'Elena Guerrero Pérez'],
  spouses: ['Andrés Molina'],
  children: ['Valentina Molina Bretón'],
});

write({
  gender: 'F', name: 'Marta Guerrero Bretón', branch: 'both',
  born: '1972-03-19',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Doctora',
  parents: ['Pedro Guerrero Pérez', 'Lucía Bretón Díaz'],
  children: ['Isabela Guerrero'],
});

write({
  gender: 'M', name: 'Jorge Guerrero Bretón', branch: 'both',
  born: '1975-11-07',
  birthplace: 'Santiago, República Dominicana', occupation: 'Músico',
  parents: ['Pedro Guerrero Pérez', 'Lucía Bretón Díaz'],
  spouses: ['Ana Ramírez de Guerrero'],
  children: ['Lucas Guerrero Ramírez', 'Emilia Guerrero Ramírez'],
});

write({
  gender: 'F', name: 'Valeria Soto de Bretón', branch: 'breton',
  born: '1971-07-22',
  birthplace: 'La Vega, República Dominicana', occupation: 'Diseñadora',
  spouses: ['Carlos Bretón Guerrero'],
  children: ['Daniela Bretón Soto', 'Miguel Bretón Soto'],
});

write({
  gender: 'M', name: 'Andrés Molina', branch: 'breton',
  born: '1969-05-30',
  birthplace: 'Puerto Plata, República Dominicana', occupation: 'Empresario',
  spouses: ['Sofía Bretón Guerrero'],
  children: ['Valentina Molina Bretón'],
});

write({
  gender: 'F', name: 'Ana Ramírez de Guerrero', branch: 'guerrero',
  born: '1977-02-11',
  birthplace: 'Santo Domingo, República Dominicana', occupation: 'Maestra',
  spouses: ['Jorge Guerrero Bretón'],
  children: ['Lucas Guerrero Ramírez', 'Emilia Guerrero Ramírez'],
});

// ── Generation 4 — Children ───────────────────────────────────────────────────

write({
  gender: 'F', name: 'Daniela Bretón Soto', branch: 'both',
  born: '1998-06-14',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Carlos Bretón Guerrero', 'Valeria Soto de Bretón'],
});

write({
  gender: 'M', name: 'Miguel Bretón Soto', branch: 'both',
  born: '2001-10-03',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Carlos Bretón Guerrero', 'Valeria Soto de Bretón'],
});

write({
  gender: 'F', name: 'Valentina Molina Bretón', branch: 'both',
  born: '2000-01-17',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Sofía Bretón Guerrero', 'Andrés Molina'],
});

write({
  gender: 'F', name: 'Isabela Guerrero', branch: 'both',
  born: '2003-09-28',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Marta Guerrero Bretón'],
});

write({
  gender: 'M', name: 'Lucas Guerrero Ramírez', branch: 'guerrero',
  born: '2002-04-05',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Jorge Guerrero Bretón', 'Ana Ramírez de Guerrero'],
});

write({
  gender: 'F', name: 'Emilia Guerrero Ramírez', branch: 'guerrero',
  born: '2005-12-19',
  birthplace: 'Santo Domingo, República Dominicana',
  parents: ['Jorge Guerrero Bretón', 'Ana Ramírez de Guerrero'],
});

console.log('\n✅ Done! Restart the dev server to see the changes.');
