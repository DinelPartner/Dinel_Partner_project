import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    image: z.string(),
    published: z.boolean().default(true),
  }),
});

export const collections = { blog };
