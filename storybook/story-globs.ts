/**
 * Globs matching every story and doc Storybook indexes, relative to this
 * directory. Kept apart from `main.ts` so the story ID test can walk the same
 * set of files without loading the full Storybook configuration.
 */
export const storyGlobs = [
	'./stories/playground/**/*.story.@(jsx|tsx)',
	'./stories/**/*.mdx',
	'./stories/design-system/**/*.story.@(ts|tsx)',
	'../packages/block-editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/global-styles-ui/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(js|tsx|mdx)',
	'./stories/icons/**/*.story.@(ts|tsx)',
	'../packages/dataviews/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-editor/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/theme/src/**/stories/*.mdx',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/grid/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-primitives/src/**/stories/*.mdx',
	'../packages/widget-primitives/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-dashboard/src/**/stories/*.mdx',
	'../packages/widget-dashboard/src/**/stories/*.story.@(ts|tsx)',
	'../packages/ui/src/**/stories/*.mdx',
	'../packages/ui/src/**/stories/*.story.@(ts|tsx)',
	'../packages/admin-ui/src/**/stories/*.story.@(ts|tsx)',
];
