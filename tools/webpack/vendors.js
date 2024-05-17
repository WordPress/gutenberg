/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

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
				],
			};
		} );
	} ),
];
