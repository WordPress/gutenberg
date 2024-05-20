/**
 * External dependencies
 */
const { join } = require( 'path' );

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

				externals:
					name === 'react'
						? {}
						: {
								react: 'React',
						  },
			};
		} );
	} ),
];
