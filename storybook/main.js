const stories = [
	process.env.NODE_ENV !== 'test' && './stories/**/*.@(js|tsx|mdx)',
	'../packages/block-editor/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/components/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/icons/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/edit-site/src/**/stories/*.@(js|tsx|mdx)',
	'../packages/components/README.mdx',
].filter( Boolean );

module.exports = {
	core: {
		builder: 'webpack5',
	},
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: { configureJSX: true, transcludeMarkdown: true },
		},
		'@storybook/addon-controls',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
		'@storybook/addon-toolbars',
		'@storybook/addon-actions',
		'storybook-source-link',
	],
	framework: '@storybook/react',
	features: {
		babelModeV7: true,
		emotionAlias: false,
		storyStoreV7: true,
	},
	typescript: {
		// TODO: this can likely be removed after upgrading to Storybook 7, along
		// with the root-level dependency on react-docgen-typescript-plugin. Without
		// this, Storybook crashes when building with Typescript 5.x.
		// See https://github.com/hipstersmoothie/react-docgen-typescript-plugin/issues/78#issuecomment-1409224863.
		reactDocgen: 'react-docgen-typescript-plugin',
	},
};
