/**
 * External dependencies
 */
const resolverNode = require( 'eslint-import-resolver-node' );

exports.interfaceVersion = 2;

exports.resolve = function ( source, file, config ) {
	if ( source.startsWith( '@wordpress/' ) ) {
		const packageName = source.slice( '@wordpress/'.length );

		let entryFile;
		try {
			entryFile = require.resolve( `../../packages/${ packageName }` );
		} catch {
			entryFile = require.resolve(
				`../../packages/${ packageName }/src/index.js`
			);
		}

		return {
			found: true,
			path: entryFile,
		};
	}

	return resolverNode.resolve( source, file, {
		...config,
		extensions: [ '.tsx', '.ts', '.mjs', '.js', '.json', '.node' ],
	} );
};
