import { getCollection, type CollectionEntry } from 'astro:content'

/**
 * Get all posts, filtering out posts whose filenames start with _
 */
export async function getFilteredPosts() {
  const posts = await getCollection('posts')
  return posts.filter((post: CollectionEntry<'posts'>) => !post.id.startsWith('_'))
}

/**
 * Get all posts sorted by publication date, filtering out posts whose filenames start with _
 */
export async function getSortedFilteredPosts() {
  const posts = await getFilteredPosts()
  return posts.sort(
    (a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )
}

/**
 * Get all posts sorted by publication date, filtering out posts whose filenames start with _
 */
export async function getSortedFilteredPostsByTag(tag: string | boolean) {
  const posts = await getFilteredPosts()

  let filteredPosts = null;

  if (tag == true || tag == false) {
    filteredPosts = posts.filter(({ data }: CollectionEntry<'posts'>) => {
      return !data.tags.length;
    });
  } else {
    filteredPosts = posts.filter(({ data }: CollectionEntry<'posts'>) => {
      return data.tags.includes(tag);
    })
  }

  return filteredPosts.sort(
    (a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )
}
