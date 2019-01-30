/**
 * Given a set of file paths as arguments, checks whether the file paths also
 * include a requisite CHANGELOG entry. The file paths should include packages
 * maintained with a CHANGELOG at, e.g. `packages/i18n/CHANGELOG.md`.
 *
 * Example (Error):
 *
 * ```
 * node bin/check-changelog.js /Gutenberg/packages/i18n/src/index.js
 * ```
 *
 * Example (Success):
 *
 * ```
 * node bin/check-changelog.js /Gutenberg/packages/i18n/src/index.js \
 *  /Gutenberg/packages/i18n/CHANGELOG.md
 * ```
 */

/**
 * External dependencies
 */

const { relative, sep, join } = require( 'path' );
const minimatch = require( 'minimatch' );

/**
 * Internal dependencies
 */

const { ignoreChanges = [] } = require( '../lerna' );

/**
 * Returns true if the given path is ignored by the Lerna `ignoreChanges`
 * configuration, or false otherwise.
 *
 * @param {string} path Path to test.
 *
 * @return {boolean} Whether path is ignored.
 */
function isIgnored( path ) {
	return ignoreChanges.some( ( pattern ) => minimatch( path, pattern ) );
}

/**
 * An array of file paths relative the `packages` directory.
 *
 * @type {string[]}
 */
const paths = process.argv
	.slice( 2 )
	.map( ( path ) => relative( 'packages', path ) );

/**
 * The set of verified package names, i.e. those which have been confirmed to
 * include an associated CHANGELOG revision.
 *
 * @type {Set}
 */
const verified = new Set;

for ( let i = 0; i < paths.length; i++ ) {
	const path = paths[ i ];

	// Not necessary to include a CHANGELOG if only editing ignored files.
	if ( isIgnored( path ) ) {
		continue;
	}

	// Find the package name as up to the first directory slash.
	const [ packageName ] = path.split( sep );

	// Skip if already verified.
	if ( verified.has( packageName ) ) {
		continue;
	}

	// Generate an expected package path for a CHANGELOG file.
	const changelogPath = join( packageName, 'CHANGELOG.md' );

	// If the changes don't also include the CHANGELOG, exit as error.
	if ( ! paths.includes( changelogPath ) ) {
		process.stdout.write(
			`\n⚠️  Missing CHANGELOG.md entry for ${ packageName } package edits.\n` +
			`\u00A0\u00A0\u00A0More information: https://github.com/WordPress/gutenberg/blob/master/packages/README.md#maintaining-changelogs\n`
		);

		process.exit( 1 );
	}

	verified.add( packageName );
}
