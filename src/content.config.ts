import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      description: z.string().min(1).optional(),
      image: z
        .object({
          url: image().optional(),
          alt: z.string().default('').optional()
        })
        .optional(),
      tags: z.array(z.string()).default([])
    })
})

const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '**/*.md' }),
  schema: z.object({})
})

export const collections = { posts, about }
