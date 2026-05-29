import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const people = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/people' }),
  schema: z.object({
    name:       z.string(),
    branch:     z.enum(['breton', 'guerrero', 'both']),
    generation: z.string(),
    born:       z.string().optional(),
    died:       z.string().optional(),
    birthplace: z.string().optional(),
    occupation: z.string().optional(),
    portrait:   z.string().optional(),
    photos:     z.array(z.object({
      src:     z.string(),
      caption: z.string().optional(),
    })).optional(),
    parents:  z.array(z.string()).optional(),
    children: z.array(z.string()).optional(),
    spouses:  z.array(z.string()).optional(),
  }),
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/stories' }),
  schema: z.object({
    title:         z.string(),
    branch:        z.enum(['breton', 'guerrero', 'both']),
    date:          z.string(),
    author:        z.string().optional(),
    featuredImage: z.string().optional(),
    relatedPeople: z.array(z.string()).optional(),
  }),
});

export const collections = { people, stories };
