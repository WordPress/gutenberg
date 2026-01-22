/**
 * External dependencies
 */
const path = require( 'path' );
const { readdir, stat } = require( 'fs/promises' );
const { createReadStream } = require( 'fs' );
const { createInterface } = require( 'readline/promises' );

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

/**
 * FIXME: Decide between i18n-ready JSON-based manifest (instead of PHP) or a
 * proper PHP script to validate the manifest.
 */
async function validateCollection() {
	const manifestPath = path.join( ICON_LIBRARY_DIR, '..', 'manifest.php' );

	try {
		await stat( manifestPath );
	} catch ( error ) {
		throw new Error(
			`Could not find icons manifest at '${ manifestPath }'`
		);
	}

	/*
	 * Validating the icons collection means verifying that each icon defined
	 * in the manifest must have a corresponding SVG file found in the library/
	 * folder and vice versa. Violations of this requirement will be collected
	 * as strings in this array.
	 */
	const problems = [];

	/*
	 * As a cheap substitute for actually parsing the PHP file, prepare to scan
	 * it line by line, looking for specific patterns to find the
	 * aforementioned violations.
	 */
	const rl = createInterface( {
		input: createReadStream( manifestPath, {
			encoding: 'utf8',
		} ),
	} );

	// Scan the manifest.php file for the keys (slugs) and `filePath` property
	// (paths) of every icon, ensuring that for each icon the path matches the
	// slug.
	//
	// Later we will reuse manifestSlugs to compare these with the SVG files
	// found in the file system.
	const manifestSlugs = [];
	const manifestPaths = [];
	for await ( const line of rl ) {
		let match;

		/*
		 * Spot the opening of an icon definition, e.g.
		 *
		 *     'wordpress' => array(
		 */
		if ( ( match = line.match( /^\t'([^']+)'\s+=> array\($/ )?.[ 1 ] ) ) {
			manifestSlugs.push( match );
			continue;
		}

		/*
		 * Spot the 'filePath' property inside an icon definition, e.g.
		 *
		 *     'filePath' => 'wordpress.svg',
		 */
		if ( ( match = line.match( /^\t\t'filePath' => '(.*)',$/ )?.[ 1 ] ) ) {
			const expected = `library/${ manifestSlugs.at( -1 ) }.svg`;

			/*
			 * This is an unexpected failure and should thus throw an error
			 * immediately, not be added to `problems`.
			 */
			if ( match !== expected ) {
				throw new Error(
					`Invalid icon definition for icon '${ manifestSlugs.at(
						-1
					) }': expected 'filePath' to be '${ expected }', saw '${ match }'`
				);
			}

			manifestPaths.push( match );

			/*
			 * Verify that the corresponding SVG file is found.
			 */
			if (
				! ( await stat(
					path.join( ICON_LIBRARY_DIR, '..', expected )
				).catch( () => false ) )
			) {
				problems.push(
					`- Icon file ${ path.join(
						ICON_LIBRARY_DIR,
						'..',
						expected
					) } not found`
				);
			}
		}
	}

	/*
	 * Conversely, check that all the SVG files under library/ are listed in
	 * the manifest.
	 */
	const svgFiles = ( await readdir( ICON_LIBRARY_DIR ) )
		.filter( ( file ) => file.match( /^[a-z0-9--]+\.svg$/ ) )
		.map( ( file ) => path.join( 'library', file ) );

	for ( const file of svgFiles ) {
		if ( ! manifestPaths.includes( file ) ) {
			problems.push(
				`- Missing entry for icon ${
					( '.', ICON_LIBRARY_DIR )
				}/${ file }`
			);
		}
	}

	if ( problems.length ) {
		throw new Error(
			`Icons manifest could not be validated. Please check ${ manifestPath }:\n${ problems.join(
				'\n'
			) }`
		);
	}
}

if ( module === require.main ) {
	validateCollection();
}

module.exports = {
	validateCollection,
};
