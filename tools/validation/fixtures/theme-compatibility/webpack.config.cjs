const path = require( 'node:path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const root = path.resolve( __dirname, '../../../..' );

// Build the same public consumer against two independently installed UI versions.
module.exports = ( env ) => {
	if ( ! env.oldUi ) {
		throw new Error( 'Pass --env oldUi=/absolute/path/to/old/consumer.' );
	}

	return [ 'old', 'new' ].map( ( version ) => ( {
		...defaultConfig,
		mode: 'production',
		entry: { index: path.join( __dirname, 'index.js' ) },
		output: {
			...defaultConfig.output,
			path: path.join( __dirname, 'build', version ),
		},
		resolve: {
			...defaultConfig.resolve,
			alias: {
				'@wordpress/ui$': path.join(
					version === 'old'
						? path.resolve(
								env.oldUi,
								'node_modules/@wordpress/ui'
							)
						: path.join( root, 'packages/ui' ),
					'build-module/index.mjs'
				),
			},
			modules: [
				version === 'old'
					? path.resolve( env.oldUi, 'node_modules' )
					: path.join( root, 'node_modules' ),
				'node_modules',
			],
		},
	} ) );
};
