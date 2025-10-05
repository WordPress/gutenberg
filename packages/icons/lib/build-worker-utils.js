/**
 * External dependencies
 */
const path = require( 'path' );
const { promisify } = require( 'util' );
const execFile = promisify( require( 'child_process' ).execFile );

/**
 * Internal dependencies
 */
const { generateTsxFiles } = require( './generate-library' );

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

/**
 * A build-worker task to be used by the monorepo's watcher-builder.
 *
 * @see bin/packages/build-worker.js
 *
 * @param {string} file File to build.
 */
async function buildSVG( file ) {
	if ( path.dirname( file ) !== ICON_LIBRARY_DIR ) {
		return false;
	}

	try {
		await execFile( 'git', [ 'ls-files', '--error-unmatch', file ] );
	} catch {
		throw new Error(
			`Cannot generate icon from untracked SVG file '${ path.basename(
				file
			) }'.
Please add it to Git, then restart:

	git add ${ path.relative( '', file ) }
	npm run dev
`
		);
	}

	await generateTsxFiles( [ path.basename( file ) ] );
	return true;
}

module.exports = { buildSVG };
