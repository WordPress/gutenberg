/**
 * Internal dependencies
 */
const baseConfig = require( '../../../storybook/main' );

const config = {
	...baseConfig,
	addons: [ '@storybook/addon-toolbars' ],
	stories: [
		'../../../packages/components/src/**/stories/e2e/*.@(js|tsx|mdx)',
	],
};

module.exports = config;
