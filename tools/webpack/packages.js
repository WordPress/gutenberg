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
				to: `build/vendors/${ key }/dev.js`,
			},
			{
				from: `node_modules/${ prodFilename }`,
				to: `build/vendors/${ key }/prod.js`,
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
				.concat( vendorsCopyConfig ),
		} ),
	].filter( Boolean ),
};
