const path = require( 'path' );
const { readdir, stat, readFile } = require( 'fs/promises' );
const { normalizeIconSvg } = require( './normalize-icon-svg.cjs' );

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

// The collections an icon may be shipped in.
const VALID_ICON_COLLECTIONS = [ 'core', 'core-admin' ];

// The format of a Dashicon class name, such as `dashicons-admin-post`.
const DASHICON_CLASS_PATTERN = /^dashicons-[a-z0-9-]+$/;

/*
 * Validating the icons collection checks that:
 *
 * - Each manifest entry has a matching SVG in library/, and vice versa.
 * - Each manifest entry's `collections` property, if present, is a non-empty array of
 *   known collection slugs.
 * - Each manifest entry's `keywords` property, if present, is an array of strings.
 * - Each manifest entry's `dashicons` property, if present, is a non-empty array
 *   of unique Dashicon class names, on an icon in the `core-admin` collection.
 * - Each Dashicon class name is replaced by at most one icon.
 * - Each SVG is one that `normalizeIconSvg()` would leave unchanged, so it
 *   follows the markup rules defined in `normalize-icon-svg.cjs`: a 24 by 24
 *   viewBox, paint that inherits currentColor, a 1.5 stroke width that scales
 *   with the icon, and so on.
 */
async function validateCollection( iconLibraryDir = ICON_LIBRARY_DIR ) {
	const manifestPath = path.join( iconLibraryDir, '..', 'manifest.json' );

	try {
		await stat( manifestPath );
	} catch {
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
	const dashiconReplacements = new Map();
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
		 * Verify that `collections`, if present, lists known collection slugs. An icon
		 * without the property stays in the JS library and is not shipped to core.
		 */
		if ( 'collections' in icon ) {
			const { collections } = icon;
			const isValid =
				Array.isArray( collections ) &&
				collections.length > 0 &&
				collections.every( ( collection ) =>
					VALID_ICON_COLLECTIONS.includes( collection )
				) &&
				new Set( collections ).size === collections.length;

			if ( ! isValid ) {
				problems.push(
					`- Invalid icon definition for icon '${
						icon.slug
					}': expected 'collections' to be a non-empty array of unique slugs out of ${ VALID_ICON_COLLECTIONS.map(
						( collection ) => `'${ collection }'`
					).join( ', ' ) }, saw ${ JSON.stringify( collections ) }`
				);
			}
		}

		/*
		 * Verify that `keywords`, if present, is an array of strings.
		 */
		if (
			'keywords' in icon &&
			( ! Array.isArray( icon.keywords ) ||
				icon.keywords.some(
					( keyword ) => typeof keyword !== 'string'
				) )
		) {
			problems.push(
				`- Invalid icon definition for icon '${
					icon.slug
				}': expected 'keywords' to be an array of strings, saw ${ JSON.stringify(
					icon.keywords
				) }`
			);
		}

		/*
		 * Verify that `dashicons`, if present, lists unique Dashicon class names,
		 * and only on icons the admin interface can render in their place.
		 */
		if ( 'dashicons' in icon ) {
			const { dashicons } = icon;
			const isValid =
				Array.isArray( dashicons ) &&
				dashicons.length > 0 &&
				dashicons.every(
					( dashicon ) =>
						typeof dashicon === 'string' &&
						DASHICON_CLASS_PATTERN.test( dashicon )
				) &&
				new Set( dashicons ).size === dashicons.length;

			if ( ! isValid ) {
				problems.push(
					`- Invalid icon definition for icon '${
						icon.slug
					}': expected 'dashicons' to be a non-empty array of unique Dashicon class names such as 'dashicons-admin-post', saw ${ JSON.stringify(
						dashicons
					) }`
				);
			} else {
				if ( ! icon.collections?.includes( 'core-admin' ) ) {
					problems.push(
						`- Invalid icon definition for icon '${ icon.slug }': 'dashicons' is only allowed on icons in the 'core-admin' collection`
					);
				}

				for ( const dashicon of dashicons ) {
					if ( dashiconReplacements.has( dashicon ) ) {
						problems.push(
							`- Invalid icon definition for icon '${
								icon.slug
							}': '${ dashicon }' is already replaced by icon '${ dashiconReplacements.get(
								dashicon
							) }'`
						);
					} else {
						dashiconReplacements.set( dashicon, icon.slug );
					}
				}
			}
		}

		/*
		 * Verify that the corresponding SVG file is found.
		 */
		if (
			! ( await stat( path.join( iconLibraryDir, '..', expected ) ).catch(
				() => false
			) )
		) {
			problems.push(
				`- Icon file ${ path.join(
					iconLibraryDir,
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
	const svgFiles = ( await readdir( iconLibraryDir ) )
		.filter( ( file ) => file.match( /^[a-z0-9--]+\.svg$/ ) )
		.map( ( file ) => path.join( 'library', file ) )

		// Enforce "/" as path separator, even on Windows
		.map( ( file ) => file.replaceAll( path.sep, '/' ) );

	for ( const file of svgFiles ) {
		const svgPath = path.join( iconLibraryDir, path.basename( file ) );

		if ( ! manifestPaths.includes( file ) ) {
			problems.push( `- Missing entry for icon ${ svgPath }` );
		}

		const svgContent = await readFile( svgPath, 'utf8' );
		let normalized;
		try {
			normalized = normalizeIconSvg( svgContent );
		} catch ( error ) {
			problems.push( `- Icon ${ svgPath }: ${ error.message }` );
			continue;
		}
		if ( normalized.content !== svgContent ) {
			problems.push(
				`- Icon ${ svgPath } is not normalized; run \`npm run normalize-svg -- <file>\` in packages/icons to fix it`
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
