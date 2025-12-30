/**
 * External dependencies
 */
const path = require( 'path' );
const DefinePlugin = require( 'webpack' ).DefinePlugin;

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
	process.env.NODE_ENV !== 'test' && './stories/**/*.story.@(jsx|tsx)',
	process.env.NODE_ENV !== 'test' && './stories/**/*.mdx',
	'../packages/block-editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/edit-site/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/global-styles-ui/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/dataviews/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/ui/src/**/stories/*.story.@(ts|tsx)',
	'../packages/ui/src/**/stories/*.mdx',
].filter( Boolean );

module.exports = {
	core: {
		disableTelemetry: true,
	},
	stories,
	staticDirs: [ './static' ],
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
		'@storybook/addon-interactions',
		'@storybook/addon-webpack5-compiler-babel',
		'storybook-source-link',
		'@geometricpanda/storybook-addon-badges',
		'./addons/design-system-theme/register',
	],
	framework: {
		name: '@storybook/react-webpack5',
		options: {},
	},
	docs: {},
	typescript: {
		reactDocgen: 'react-docgen-typescript',
	},
	webpackFinal: async ( config ) => {
		// Find the `babel-loader` rule added by `@storybook/addon-webpack5-compiler-babel`
		// and add exclude for `packages/*/build-module` folders.
		const rules = config.module.rules.map( ( rule ) => {
			const usesBabelLoader =
				Array.isArray( rule.use ) &&
				rule.use.some(
					( loader ) =>
						typeof loader === 'object' &&
						loader.loader &&
						loader.loader.includes( 'babel-loader' )
				);

			// Add exclude for `build-module` folders
			if ( usesBabelLoader && Array.isArray( rule.exclude ) ) {
				return {
					...rule,
					exclude: [ ...rule.exclude, /build-module/ ],
				};
			}
			return rule;
		} );

		return {
			...config,
			module: {
				...config.module,
				rules: [
					...rules,
					{
						test: /\.md$/,
						type: 'asset/source',
					},
					{
						test: /\/stories\/.+\.story\.(j|t)sx?$/,
						use: [
							{
								// Adds a `sourceLink` parameter to the story metadata, based on the file path
								loader: path.resolve(
									__dirname,
									'./webpack/source-link-loader.js'
								),
							},
							{
								// Reads `tags` from the story metadata and copies them to `badges`
								loader: path.resolve(
									__dirname,
									'./webpack/copy-tags-to-badges.js'
								),
							},
						],
						enforce: 'post',
					},
					{
						test: /\.scss$/,
						exclude: /\.lazy\.scss$/,
						use: scssLoaders( { isLazy: false } ),
					},
					{
						test: /\.lazy\.scss$/,
						use: scssLoaders( { isLazy: true } ),
						include: path.resolve( __dirname ),
					},
				],
			},
			plugins: [
				...config.plugins,
				new DefinePlugin( {
					// Ensures that `@wordpress/warning` can properly detect dev mode.
					'globalThis.SCRIPT_DEBUG': JSON.stringify(
						process.env.NODE_ENV === 'development'
					),
				} ),
			],
		};
	},
};
