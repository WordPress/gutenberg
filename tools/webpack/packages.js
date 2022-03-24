/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { join } = require( 'path' );
const { flatMap } = require( 'lodash' );

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
const BUNDLED_PACKAGES = [
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/style-engine',
];

// PHP files in packages that have to be copied over to /lib.
const BUNDLED_PACKAGES_PHP = [
	{
		from: './packages/style-engine/',
		to: 'lib/style-engine/',
		replaceClasses: [ 'WP_Style_Engine' ],
	},
];

const gutenbergPackages = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
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
};
const vendorsCopyConfig = flatMap(
	vendors,
	( [ devFilename, prodFilename ], key ) => {
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
			patterns: [].concat(
				gutenbergPackages.map( ( packageName ) => ( {
					from: '*.css',
					to: `./build/${ packageName }`,
					transform: stylesTransform,
					noErrorOnMissing: true,
				} ) ),
				// Packages with PHP files to be parsed and copied to ./lib.
				BUNDLED_PACKAGES_PHP.map(
					( { from, to, replaceClasses } ) => ( {
						from: `${ from }/*.php`,
						to: ( { absoluteFilename } ) => {
							const [ , filename ] = absoluteFilename.match(
								/([\w-]+)(\.php){1,1}$/
							);
							return join( to, `${ filename }-gutenberg.php` );
						},
						transform: ( content ) => {
							const classSuffix = '_Gutenberg';
							content = content.toString();
							// Replace class names.
							content = content.replace(
								new RegExp( replaceClasses.join( '|' ), 'g' ),
								( match ) => `${ match }${ classSuffix }`
							);
							return content;
						},
						noErrorOnMissing: true,
					} )
				),
				vendorsCopyConfig
			),
		} ),
	].filter( Boolean ),
};
