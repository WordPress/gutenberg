import type { StorybookConfig } from '@storybook/react-vite';
import baseConfig from '@wordpress/storybook/main';

export default {
	...baseConfig,
	docs: undefined,
	staticDirs: undefined,
	typescript: {
		...baseConfig.typescript,
		reactDocgenTypescriptOptions: {
			...baseConfig.typescript?.reactDocgenTypescriptOptions,
			// Vite's root is this workspace, so include the source files used
			// by these stories outside that root in the docgen project.
			include: [
				'**/*.tsx',
				'../../packages/components/src/**/*.tsx',
				'../../packages/ui/src/**/*.tsx',
				'../../storybook/**/*.tsx',
			],
		},
	},
	stories: [
		'../../../packages/components/src/**/stories/e2e/*.story.@(tsx|mdx)',
		'../../../packages/ui/src/**/stories/e2e/*.story.@(ts|tsx|mts|cts|mdx)',
	],
} satisfies StorybookConfig;
