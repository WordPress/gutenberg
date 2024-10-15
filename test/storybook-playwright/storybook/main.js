/**
 * Internal dependencies
 */
const baseConfig = require( '../../../storybook/main' );

const config = {
	...baseConfig,
	addons: [ '@storybook/addon-toolbars' ],
	docs: undefined,
	staticDirs: undefined,
	stories: [
		'../../../packages/components/src/**/stories/e2e/*.story.@(js|tsx|mdx)',
	],
};

module.exports = config;
