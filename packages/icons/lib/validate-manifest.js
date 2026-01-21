/**
 * External dependencies
 */
const path = require( 'path' );
const { readdir, readFile, stat } = require( 'fs' ).promises;

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

/*
 * For now, not much is needed to pass validation:
 *
 * - Expect a manifest of icons called `index.json`
 * - Expect it to include the filename of every SVG icon in the library
 */
async function validateCollection() {
	const manifest = path.join( ICON_LIBRARY_DIR, 'index.json' );

	let manifestData;
	try {
		await stat( manifest );
		manifestData = JSON.parse( await readFile( manifest ) );
	} catch ( error ) {
		throw new Error(
			`Could not decode icons manifest file at ${ ( '.', manifest ) }`,
			{
				cause: error,
			}
		);
	}

	const svgFiles = ( await readdir( ICON_LIBRARY_DIR ) ).filter( ( file ) =>
		file.match( /^[a-z0-9--]+\.svg$/ )
	);

	const problems = [];

	// Check that all icons in manifest are in the directory
	for ( const slug of manifestData ) {
		if (
			! ( await stat( path.join( ICON_LIBRARY_DIR, slug ) ).catch(
				() => false
			) )
		) {
			problems.push(
				`- File ${ ( '.', ICON_LIBRARY_DIR ) }/${ slug } not found`
			);
		}
	}

	// Check that all icons in the directory are in the manifest
	for ( const file of svgFiles ) {
		if ( ! manifestData.includes( file ) ) {
			problems.push(
				`- Missing manifest entry for file ${
					( '.', ICON_LIBRARY_DIR )
				}/${ file }`
			);
		}
	}

	if ( problems.length ) {
		throw new Error(
			`Icons manifest could not be validated:\n${ problems.join( '\n' ) }`
		);
	}

	return true;
}

if ( module === require.main ) {
	validateCollection();
}

module.exports = {
	validateCollection,
};
