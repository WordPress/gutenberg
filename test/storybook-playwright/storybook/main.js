/**
 * Internal dependencies
 */
const baseConfig = require( '../../../storybook/main' );

const config = {
	...baseConfig,
	addons: [],
	stories: [
		'../../../packages/components/src/**/e2e.stories.@(js|tsx|mdx)',
	],
};

module.exports = config;
