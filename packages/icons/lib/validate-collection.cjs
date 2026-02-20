/**
 * External dependencies
 */
const path = require( 'path' );
const { readdir, stat, readFile } = require( 'fs/promises' );

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

/*
 * Validating the icons collection means verifying that each icon defined in
 * the manifest has a corresponding SVG file found in the library/ folder and
 * vice versa.
 */
async function validateCollection() {
	const manifestPath = path.join( ICON_LIBRARY_DIR, '..', 'manifest.json' );

	try {
		await stat( manifestPath );
	} catch ( error ) {
		throw new Error(
			`Could not find icons manifest at '${ manifestPath }'`
		);
	}

	const manifestContent = await readFile( manifestPath, 'utf8' );
	const manifest = JSON.parse( manifestContent );

	/*
	 * Collect policy violations as strings.
	 */
	const problems = [];

	/*
	 * Scan manifest.json for the slugs and `filePath` property (paths)
	 * of every icon, ensuring that for each icon the path matches the slug.
	 *
	 * Later we will reuse manifestPaths to compare these with the SVG files
	 * found in the file system.
	 */
	const manifestPaths = [];
	for ( const icon of manifest ) {
		const expected = `library/${ icon.slug }.svg`;

		/*
		 * This is an unexpected failure and should thus throw an error
		 * immediately, not be added to `problems`.
		 */
		if ( icon.filePath !== expected ) {
			throw new Error(
				`Invalid icon definition for icon '${ icon.slug }': expected 'filePath' to be '${ expected }', saw '${ icon.filePath }'`
			);
		}

		manifestPaths.push( icon.filePath );

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

	/*
	 * Conversely, check that all the SVG files under library/ are listed in
	 * the manifest.
	 */
	const svgFiles = ( await readdir( ICON_LIBRARY_DIR ) )
		.filter( ( file ) => file.match( /^[a-z0-9--]+\.svg$/ ) )
		.map( ( file ) => path.join( 'library', file ) )

		// Enforce "/" as path separator, even on Windows
		.map( ( file ) => file.replaceAll( path.sep, '/' ) );

	for ( const file of svgFiles ) {
		if ( ! manifestPaths.includes( file ) ) {
			problems.push(
				`- Missing entry for icon ${ path.join(
					ICON_LIBRARY_DIR,
					path.basename( file )
				) }`
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
