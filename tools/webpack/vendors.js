/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const copiedVendors = {
	'inert-polyfill': [
		'wicg-inert/dist/inert.js',
		'wicg-inert/dist/inert.min.js',
	],
};
const importedVendors = {
	react: { import: 'react', global: 'React' },
	'react-dom': { import: 'react-dom', global: 'ReactDOM' },
	'react-jsx-runtime': {
		import: 'react/jsx-runtime',
		global: 'ReactJSXRuntime',
	},
};

module.exports = [
	...Object.entries( importedVendors ).flatMap( ( [ name, config ] ) => {
		return [ 'production', 'development' ].map( ( mode ) => {
			return {
				mode,
				target: 'browserslist',
				output: {
					filename:
						mode === 'development'
							? `vendors/[name].js`
							: `vendors/[name].min.js`,
					path: join( __dirname, '..', '..', 'build' ),
				},
				entry: {
					[ name ]: {
						import: config.import,
						library: {
							name: config.global,
							type: 'window',
						},
					},
				},

				plugins: [
					new DependencyExtractionWebpackPlugin( {
						injectPolyfill: false,
						useDefaults: false,
						requestToExternal: ( request ) => {
							if ( name !== 'react' && request === 'react' ) {
								return 'React';
							}
						},
						requestToHandle: ( request ) => {
							if ( name !== 'react' && request === 'react' ) {
								return 'react';
							}
						},
					} ),
				].concat(
					// This is just a way to add this copy plugin only once to the webpack config.
					mode === 'production' && name === 'react'
						? [
								new CopyWebpackPlugin( {
									patterns: Object.entries(
										copiedVendors
									).flatMap(
										( [
											key,
											[ devFilename, prodFilename ],
										] ) => {
											return [
												{
													from: `node_modules/${ devFilename }`,
													to: `vendors/${ key }.js`,
												},
												{
													from: `node_modules/${ prodFilename }`,
													to: `vendors/${ key }.min.js`,
												},
											];
										}
									),
								} ),
						  ]
						: []
				),
			};
		} );
	} ),
];
