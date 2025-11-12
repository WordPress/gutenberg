/**
 * Internal dependencies
 */
const baseConfig = require( '../../../storybook/main' );

const config = {
	...baseConfig,
	addons: [
		'@storybook/addon-toolbars',
		'@storybook/addon-webpack5-compiler-babel',
	],
	docs: undefined,
	staticDirs: undefined,
	stories: [
		'../../../packages/components/src/**/stories/e2e/*.story.@(js|tsx|mdx)',
	],
};

module.exports = config;
