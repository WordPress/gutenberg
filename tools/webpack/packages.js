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
const { dependencies } = require( '../../package' );
const { baseConfig, plugins, stylesTransform } = require( './shared' );

const WORDPRESS_NAMESPACE = '@wordpress/';

// Experimental or other packages that should be private are bundled when used.
// That way, we can iterate on these package without making them part of the public API.
// See: https://github.com/WordPress/gutenberg/pull/19809
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

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

const gutenbergPackages = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'interactivity' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

const exportDefaultPackages = [
	'api-fetch',
	'deprecated',
	'dom-ready',
	'redux-routine',
	'token-list',
	'server-side-render',
	'shortcode',
	'warning',
];

const vendors = {
	react: [
		'react/umd/react.development.js',
		'react/umd/react.production.min.js',
	],
	'react-dom': [
		'react-dom/umd/react-dom.development.js',
		'react-dom/umd/react-dom.production.min.js',
	],
	'inert-polyfill': [
		'wicg-inert/dist/inert.js',
		'wicg-inert/dist/inert.min.js',
	],
};
const vendorsCopyConfig = Object.entries( vendors ).flatMap(
	( [ key, [ devFilename, prodFilename ] ] ) => {
		return [
			{
				from: `node_modules/${ devFilename }`,
				to: `build/vendors/${ key }.js`,
			},
			{
				from: `node_modules/${ prodFilename }`,
				to: `build/vendors/${ key }.min.js`,
			},
		];
	}
);
module.exports = {
	...baseConfig,
	name: 'packages',
	entry: gutenbergPackages.reduce( ( memo, packageName ) => {
		return {
			...memo,
			[ packageName ]: {
				import: `./packages/${ packageName }`,
				library: {
					name: [ 'wp', camelCaseDash( packageName ) ],
					type: 'window',
					export: exportDefaultPackages.includes( packageName )
						? 'default'
						: undefined,
				},
			},
		};
	}, {} ),
	output: {
		devtoolNamespace: 'wp',
		filename: './build/[name]/index.min.js',
		path: join( __dirname, '..', '..' ),
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		new CopyWebpackPlugin( {
			patterns: gutenbergPackages
				.map( ( packageName ) => ( {
					from: '*.css',
					context: `./packages/${ packageName }/build-style`,
					to: `./build/${ packageName }`,
					transform: stylesTransform,
					noErrorOnMissing: true,
				} ) )
				.concat( bundledPackagesPhpConfig )
				.concat( vendorsCopyConfig ),
		} ),
		new MomentTimezoneDataPlugin( {
			startYear: 2000,
			endYear: 2040,
		} ),
	].filter( Boolean ),
};
