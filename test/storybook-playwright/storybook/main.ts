import type { StorybookConfig } from '@storybook/react-vite';
import baseConfig from '@wordpress/storybook/main';

export default {
	...baseConfig,
	docs: undefined,
	staticDirs: undefined,
	stories: [
		'../../../packages/components/src/**/stories/e2e/*.story.@(js|tsx|mdx)',
	],
} satisfies StorybookConfig;
