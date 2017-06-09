/**
 * Block categories.
 *
 * Group blocks together based on common traits
 * The block "inserter" relies on these to present the list blocks
 *
 * @var {Array} categories
 */
const categories = [
  { slug: 'common', title: 'Common Blocks' },
  { slug: 'formatting', title: 'Formatting' },
  { slug: 'layout', title: 'Layout Blocks' },
  { slug: 'widgets', title: 'Widgets' },
  { slug: 'embed', title: 'Embed' },
];

/**
 * Returns all the block categories
 *
 * @return {Array} Block categories
 */
export function getCategories() {
  return categories;
}
