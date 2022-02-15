const stories = [
	process.env.NODE_ENV !== 'test' && './stories/**/*.@(js|tsx|mdx)',
	'../packages/block-editor/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/components/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/icons/src/**/stories/*.@(js|tsx|mdx)',
].filter( Boolean );

const customEnvVariables = {};

module.exports = {
	core: {
		builder: 'webpack5',
	},
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: { configureJSX: true },
		},
		'@storybook/addon-controls',
		'@storybook/addon-knobs', // deprecated, new stories should use addon-controls
		'@storybook/addon-storysource',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
		'@storybook/addon-toolbars',
	],
	features: {
		babelModeV7: true,
		emotionAlias: false,
	},
	// Workaround:
	// https://github.com/storybookjs/storybook/issues/12270
	webpackFinal: async ( config ) => {
		// Find the DefinePlugin
		const plugin = config.plugins.find( ( p ) => {
			return p.definitions && p.definitions[ 'process.env' ];
		} );
		// Add custom env variables
		Object.keys( customEnvVariables ).forEach( ( key ) => {
			plugin.definitions[ 'process.env' ][ key ] = JSON.stringify(
				customEnvVariables[ key ]
			);
		} );

		return config;
	},
};
