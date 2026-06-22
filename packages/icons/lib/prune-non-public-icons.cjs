/**
 * External dependencies
 */
const path = require( 'path' );
const { readFile, readdir, unlink } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { getPublicIcons } = require( './get-public-icons.cjs' );

const MANIFEST_JSON_PATH = path.join( __dirname, '..', 'src', 'manifest.json' );
const LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

/**
 * Deletes every non-public SVG in the icon library.
 *
 * Non-public icons are those not explicitly marked as `public: true` in the manifest. Must run after icon collection
 * validation, which expects the manifest and library to match 1:1.
 *
 * @param {Object} [options]              Options.
 * @param {string} [options.libraryDir]   Directory containing the SVG files.
 * @param {string} [options.manifestPath] Path to manifest.json.
 * @return {Promise<{pruned: number, retained: number}>} Prune summary.
 */
async function pruneNonPublicIcons( {
	libraryDir = LIBRARY_DIR,
	manifestPath = MANIFEST_JSON_PATH,
} = {} ) {
	const manifest = JSON.parse( await readFile( manifestPath, 'utf8' ) );
	const publicFiles = new Set(
		getPublicIcons( manifest ).map( ( item ) =>
			path.basename( item.filePath )
		)
	);

	const svgFiles = ( await readdir( libraryDir ) ).filter( ( file ) =>
		file.endsWith( '.svg' )
	);

	let pruned = 0;
	for ( const file of svgFiles ) {
		if ( ! publicFiles.has( file ) ) {
			await unlink( path.join( libraryDir, file ) );
			pruned++;
		}
	}

	const retained = svgFiles.length - pruned;
	// eslint-disable-next-line no-console
	console.log(
		`Pruned ${ pruned } non-public icon(s); ${ retained } retained.`
	);

	return { pruned, retained };
}

module.exports = { pruneNonPublicIcons };

if ( module === require.main ) {
	pruneNonPublicIcons();
}
