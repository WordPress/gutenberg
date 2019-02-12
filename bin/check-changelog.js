/**
 * Optionally given a set of file paths as arguments, checks whether all files
 * modified on the current branch (including those passed as arguments) include
 * a requisite CHANGELOG entry.
 */

/**
 * External dependencies
 */

const { relative, sep, join } = require( 'path' );
const minimatch = require( 'minimatch' );
const { execSync } = require( 'child_process' );
const { flow, toString, trim } = require( 'lodash' );

/**
 * Internal dependencies
 */

const { ignoreChanges = [] } = require( '../lerna' );

/**
 * Utility function to trim the result of an execSync string result.
 *
 * @param {string} command Command to exec.
 *
 * @return {string} Result of exec.
 */
const exec = flow( execSync, toString, trim );

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
 * Merge base commit SHA on which to perform git file diff.
 *
 * @type {string}
 */
const base = exec( 'git merge-base master HEAD' );

/**
 * Set of files to consider as changed, as a combination of those already
 * changed on the current branch and those passed in as file arguments.
 *
 * @type {string[]}
 */
const files = [
	...exec( `git diff --name-only ${ base }` ).split( '\n' ),
	...process.argv.slice( 2 ),
];

/**
 * An array of file paths relative the `packages` directory.
 *
 * @type {string[]}
 */
const paths = files
	.map( ( path ) => relative( 'packages', path ) )
	.filter( ( path ) => path[ 0 ] !== '.' );

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
