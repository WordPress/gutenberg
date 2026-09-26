/**
 * Globs matching every story and doc Storybook indexes, relative to this
 * directory. Kept apart from `main.ts` so the story ID test can walk the same
 * set of files without loading the full Storybook configuration.
 */
export const storyGlobs = [
	'./stories/playground/**/*.story.@(jsx|tsx)',
	'./stories/**/*.mdx',
	'./stories/design-system/**/*.story.@(ts|tsx|mts|cts)',
	'../packages/block-editor/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/editor/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/global-styles-ui/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(tsx|mdx)',
	'./stories/icons/**/*.story.@(ts|tsx|mts|cts)',
	'../packages/dataviews/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/media-editor/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/theme/src/**/stories/*.mdx',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/grid/src/**/stories/*.story.@(ts|tsx|mts|cts)',
	'../packages/widget-primitives/src/**/stories/*.mdx',
	'../packages/widget-primitives/src/**/stories/*.story.@(ts|tsx|mts|cts)',
	'../packages/widget-dashboard/src/**/stories/*.mdx',
	'../packages/widget-dashboard/src/**/stories/*.story.@(ts|tsx|mts|cts)',
	'../packages/ui/src/**/stories/*.mdx',
	'../packages/ui/src/**/stories/*.story.@(ts|tsx|mts|cts)',
	'../packages/admin-ui/src/**/stories/*.story.@(ts|tsx|mts|cts)',
];
