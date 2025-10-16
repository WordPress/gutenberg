/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const MomentTimezoneDataPlugin = require( 'moment-timezone-data-webpack-plugin' );
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const {
	camelCaseDash,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

const WORDPRESS_NAMESPACE = '@wordpress/';

// PHP files in packages that have to be copied during build.
const bundledPackagesPhpConfig = [
	{
		from: './packages/style-engine/',
		to: 'build/style-engine/',
		replaceClasses: [
			'WP_Style_Engine_CSS_Declarations',
			'WP_Style_Engine_CSS_Rules_Store',
			'WP_Style_Engine_CSS_Rule',
			'WP_Style_Engine_Processor',
			'WP_Style_Engine',
		],
	},
].map( ( { from, to, replaceClasses } ) => ( {
	from: `${ from }/*.php`,
	to( { absoluteFilename } ) {
		const [ , filename ] = absoluteFilename.match(
			/([\w-]+)(\.php){1,1}$/
		);
		return join( to, `${ filename }-gutenberg.php` );
	},
	transform: ( content ) => {
		const classSuffix = '_Gutenberg';
		const functionPrefix = 'gutenberg_';
		content = content.toString();
		// Replace class names.
		content = content.replace(
			new RegExp( replaceClasses.join( '|' ), 'g' ),
			( match ) => `${ match }${ classSuffix }`
		);
		// Replace function names.
		content = Array.from(
			content.matchAll( /^\s*function ([^\(]+)/gm )
		).reduce( ( result, [ , functionName ] ) => {
			// Prepend the Gutenberg prefix, substituting any
			// other core prefix (e.g. "wp_").
			return result.replace(
				new RegExp( functionName, 'g' ),
				( match ) => functionPrefix + match.replace( /^wp_/, '' )
			);
		}, content );
		return content;
	},
} ) );

/**
 * All packages are now built by esbuild (bin/packages/build.mjs).
 * Webpack is only used for file copying operations (PHP files, vendor bundles).
 *
 * @type {Array<string>}
 */
const gutenbergScripts = [];

const copiedVendors = {
	'react.js': 'react/umd/react.development.js',
	'react.min.js': 'react/umd/react.production.min.js',
	'react-dom.js': 'react-dom/umd/react-dom.development.js',
	'react-dom.min.js': 'react-dom/umd/react-dom.production.min.js',
};

module.exports = {
	...baseConfig,
	name: 'packages',
	entry: Object.fromEntries(
		gutenbergScripts.map( ( packageName ) => {
			const packageJson = require(
				`${ WORDPRESS_NAMESPACE }${ packageName }/package.json`
			);
			return [
				packageName,
				{
					import: `./packages/${ packageName }`,
					library: {
						name: [ 'wp', camelCaseDash( packageName ) ],
						type: 'window',
						export: packageJson.wpScriptDefaultExport
							? 'default'
							: undefined,
					},
				},
			];
		} )
	),
	output: {
		devtoolNamespace: 'wp',
		filename: './build/[name]/index.min.js',
		path: join( __dirname, '..', '..' ),
		devtoolModuleFilenameTemplate: ( info ) => {
			if ( info.resourcePath.includes( '/@wordpress/' ) ) {
				const resourcePath =
					info.resourcePath.split( '/@wordpress/' )[ 1 ];
				return `../../packages/${ resourcePath }`;
			}
			return `webpack://${ info.namespace }/${ info.resourcePath }`;
		},
	},
	module: {
		rules: [
			...baseConfig.module.rules,
			{
				test: /\.wasm$/,
				type: 'asset/resource',
				generator: {
					// FIXME: Do not hardcode path.
					filename: './build/vips/[name].wasm',
					publicPath: '',
				},
			},
		],
	},
	performance: {
		hints: false, // disable warnings about package sizes
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: false } ),
		new CopyWebpackPlugin( {
			patterns: bundledPackagesPhpConfig.concat(
				Object.entries( copiedVendors ).map( ( [ to, from ] ) => ( {
					from: `node_modules/${ from }`,
					to: `build/vendors/${ to }`,
				} ) )
			),
		} ),
		new MomentTimezoneDataPlugin( {
			startYear: 2000,
			endYear: 2040,
		} ),
	].filter( Boolean ),
};
