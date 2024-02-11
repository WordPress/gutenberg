/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

const scssLoaders = ( { isLazy } ) => [
	{
		loader: 'style-loader',
		options: { injectType: isLazy ? 'lazyStyleTag' : 'styleTag' },
	},
	'css-loader',
	{
		loader: 'postcss-loader',
		options: {
			postcssOptions: {
				ident: 'postcss',
				plugins: postcssPlugins,
			},
		},
	},
	'sass-loader',
];

const stories = [
	process.env.NODE_ENV !== 'test' && './stories/**/*.story.@(js|tsx)',
	process.env.NODE_ENV !== 'test' && './stories/**/*.mdx',
	'../packages/block-editor/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/icons/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/edit-site/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/dataviews/src/**/stories/*.story.@(js|tsx|mdx)',
].filter( Boolean );

module.exports = {
	core: {
		disableTelemetry: true,
	},
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: { configureJSX: true },
		},
		'@storybook/addon-controls',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
		'@storybook/addon-toolbars',
		'@storybook/addon-actions',
		'storybook-source-link',
		'@geometricpanda/storybook-addon-badges',
	],
	framework: {
		name: '@storybook/react-webpack5',
		options: {},
	},
	features: {
		babelModeV7: true,
		emotionAlias: false,
		storyStoreV7: true,
	},
	docs: {
		autodocs: true,
	},
	webpackFinal: async ( config ) => {
		return {
			...config,
			module: {
				...config.module,
				rules: [
					...config.module.rules,
					{
						// Adds a `sourceLink` parameter to the story metadata, based on the file path
						test: /\/stories\/.+\.story\.(j|t)sx?$/,
						loader: path.resolve(
							__dirname,
							'./webpack/source-link-loader.js'
						),
						enforce: 'post',
					},
					{
						test: /\.scss$/,
						exclude: /\.lazy\.scss$/,
						use: scssLoaders( { isLazy: false } ),
						include: path.resolve( __dirname ),
					},
					{
						test: /\.lazy\.scss$/,
						use: scssLoaders( { isLazy: true } ),
						include: path.resolve( __dirname ),
					},
				],
			},
		};
	},
};
