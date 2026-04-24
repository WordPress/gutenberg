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

	const FgRed = '\x1b[31m';
	const Reset = '\x1b[0m';

	try {
		await execFile( 'git', [ 'ls-files', '--error-unmatch', file ] );
	} catch {
		throw new Error(
			`${ FgRed }Cannot generate icon from untracked SVG file '${ path.basename(
				file
			) }'.${ Reset }
${ FgRed }Please add it to Git, then restart:${ Reset }

${ FgRed }	git add ${ path.relative( '', file ) }${ Reset }
${ FgRed }	npm run dev${ Reset }
`
		);
	}

	await generateTsxFiles( [ path.basename( file ) ] );
	return true;
}

module.exports = { buildSVG };
