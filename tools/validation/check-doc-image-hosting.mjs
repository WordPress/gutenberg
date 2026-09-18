#!/usr/bin/env node

/**
 * Advisory check for documentation image hosting.
 *
 * Images embedded in the Block Editor Handbook should be hosted in the
 * developer.wordpress.org Media Library, not linked from GitHub. GitHub-hosted
 * images (e.g. `raw.githubusercontent.com`) are rate-limited and can fail to
 * load (HTTP 429) once the docs are synced to developer.wordpress.org.
 *
 * This check is intentionally NON-BLOCKING: by default it always exits 0 and
 * reports findings as warnings (GitHub Actions annotations in CI, plain text
 * locally). Pass `--strict` to exit with a non-zero code when findings exist.
 *
 * SVG assets are exempt: the Media Library does not accept SVG uploads, so they
 * may remain in the repository and be referenced via their GitHub URL. The
 * flagged raster extensions mirror the image formats the Media Library accepts
 * by default (see `wp_get_mime_types()` in WordPress core).
 *
 * It has no third-party dependencies so it can run in a lightweight CI job
 * without a full `npm install`.
 *
 * Usage:
 *   node check-doc-image-hosting.mjs [--strict] [file ...]
 *
 * With no file arguments, a default set of documentation sources is scanned.
 * File arguments (e.g. the changed files in a pull request) are checked as-is.
 */

/**
 * Node dependencies
 */
import { dirname, resolve, relative, join } from 'path';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';

const GITHUB_HOST = /(?:githubusercontent\.com|github\.com)/i;
const RASTER_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif)$/i;
const SVG_EXTENSION = /\.svg$/i;
const USER_ATTACHMENT = /github\.com\/user-attachments\/assets\//i;
const URL_PATTERN = /https?:\/\/[^\s)"'<>\]]+/g;
const DOC_EXTENSION = /\.mdx?$/i;

const GUIDANCE =
	'Host it in the developer.wordpress.org Media Library instead. See docs/contributors/documentation/README.md ("Images").';

/**
 * Finds GitHub-hosted raster image references in a documentation file's text.
 *
 * Flags raster images (png, jpg, gif, webp, avif) and GitHub user-attachment
 * assets served from GitHub, which are rate-limited when synced to
 * developer.wordpress.org. SVGs are exempt because the Media Library does not
 * accept SVG uploads.
 *
 * Exported for unit testing.
 *
 * @param {string} content The file's text content.
 * @return {{line: number, message: string}[]} The findings.
 */
export function findGitHubHostedImages( content ) {
	const findings = [];
	const lines = content.split( /\r?\n/ );

	lines.forEach( ( line, index ) => {
		const urls = line.match( URL_PATTERN );
		if ( ! urls ) {
			return;
		}

		for ( const url of urls ) {
			if ( ! GITHUB_HOST.test( url ) ) {
				continue;
			}

			// Ignore the query string / fragment when testing the extension.
			const path = url.split( /[?#]/ )[ 0 ];

			// SVGs are an accepted exception.
			if ( SVG_EXTENSION.test( path ) ) {
				continue;
			}

			const isRaster = RASTER_EXTENSION.test( path );
			const isAttachment = USER_ATTACHMENT.test( url );
			if ( ! isRaster && ! isAttachment ) {
				continue;
			}

			findings.push( {
				line: index + 1,
				message: `GitHub-hosted image: ${ url }. ${ GUIDANCE }`,
			} );
		}
	} );

	return findings;
}

/**
 * The set of rules applied to each documentation file. Each rule's `find`
 * receives the file's text content and returns an array of `{ line, message }`
 * findings.
 *
 * Today there is a single rule. Keeping it as a list makes it straightforward to
 * add further documentation rules later without reworking the runner.
 */
const rules = [ { name: 'github-hosted-image', find: findGitHubHostedImages } ];

/**
 * Recursively collects files under a directory that match a predicate, skipping
 * `node_modules`.
 *
 * @param {string}                  dir       Absolute directory to walk.
 * @param {(file: string)=>boolean} predicate Returns true to include a file.
 * @param {string[]}                collected Accumulator (used internally).
 * @return {string[]} Absolute file paths.
 */
function walk( dir, predicate, collected = [] ) {
	if ( ! existsSync( dir ) ) {
		return collected;
	}

	for ( const entry of readdirSync( dir, { withFileTypes: true } ) ) {
		if ( entry.name === 'node_modules' ) {
			continue;
		}

		const fullPath = join( dir, entry.name );
		if ( entry.isDirectory() ) {
			walk( fullPath, predicate, collected );
		} else if ( predicate( fullPath ) ) {
			collected.push( fullPath );
		}
	}

	return collected;
}

/**
 * The default set of documentation files published to the Block Editor
 * Handbook: everything under `docs/`, plus package `README.md` files (which the
 * docs tooling pulls in). Storybook stories and other package sources are not
 * published as handbook pages, so they are not scanned by default.
 *
 * @param {string} repoRoot Absolute path to the repository root.
 * @return {string[]} Absolute file paths.
 */
function defaultDocFiles( repoRoot ) {
	const docs = walk( resolve( repoRoot, 'docs' ), ( file ) =>
		DOC_EXTENSION.test( file )
	);
	const packageReadmes = walk( resolve( repoRoot, 'packages' ), ( file ) =>
		/(?:^|[/\\])README\.md$/i.test( file )
	);
	return [ ...docs, ...packageReadmes ];
}

/**
 * Resolves the list of files to check, either from CLI arguments or the default
 * documentation sources. Non-existent paths, directories, and node_modules are
 * filtered out.
 *
 * @param {string[]} fileArgs Explicit file paths passed on the command line.
 * @param {string}   repoRoot Absolute path to the repository root.
 * @return {string[]} Absolute file paths to check.
 */
function resolveFiles( fileArgs, repoRoot ) {
	let candidates;

	if ( fileArgs.length ) {
		candidates = fileArgs
			.map( ( file ) => resolve( repoRoot, file ) )
			.filter(
				( file ) =>
					DOC_EXTENSION.test( file ) &&
					! file.includes( 'node_modules' ) &&
					existsSync( file ) &&
					statSync( file ).isFile()
			);
	} else {
		candidates = defaultDocFiles( repoRoot );
	}

	// De-duplicate (a file may be listed more than once).
	return [ ...new Set( candidates ) ];
}

/**
 * Runs the check as a command-line tool: scans the requested files, reports
 * findings, and exits. Always exits 0 unless `--strict` is passed.
 */
function main() {
	// Resolve the repo root from this script's location (tools/validation/…)
	// rather than `import.meta`, so the module stays importable by unit tests.
	const repoRoot = resolve( dirname( process.argv[ 1 ] ), '../..' );

	const args = process.argv.slice( 2 );
	const strict = args.includes( '--strict' );
	const fileArgs = args.filter( ( arg ) => ! arg.startsWith( '--' ) );
	const isCI = Boolean( process.env.GITHUB_ACTIONS );

	// Minimal, dependency-free coloring (only when writing to a TTY).
	const useColor = Boolean( process.stdout.isTTY );
	const yellow = ( text ) => ( useColor ? `[33m${ text }[0m` : text );
	const bold = ( text ) => ( useColor ? `[1m${ text }[0m` : text );

	const files = resolveFiles( fileArgs, repoRoot );
	let findingCount = 0;

	for ( const file of files ) {
		const relativePath = relative( repoRoot, file );
		let content;
		try {
			content = readFileSync( file, 'utf8' );
		} catch {
			continue;
		}

		for ( const rule of rules ) {
			for ( const finding of rule.find( content ) ) {
				findingCount++;

				if ( isCI ) {
					// GitHub Actions annotation. Always a warning so the check
					// is non-blocking regardless of the job's success.
					const message = finding.message.replace( /\n/g, '%0A' );
					console.log(
						`::warning file=${ relativePath },line=${ finding.line },title=Documentation image hosting::${ message }`
					);
				} else {
					console.log(
						`${ yellow( 'warning' ) } ${ bold(
							`${ relativePath }:${ finding.line }`
						) } ${ finding.message }`
					);
				}
			}
		}
	}

	if ( findingCount ) {
		const summary = `Found ${ findingCount } GitHub-hosted image reference(s) in documentation.`;
		console.log( `\n${ isCI ? summary : yellow( summary ) }` );
		console.log(
			'These may be rate-limited (HTTP 429) once synced to developer.wordpress.org.'
		);
		if ( strict ) {
			process.exit( 1 );
		}
	} else {
		console.log(
			`Checked ${ files.length } documentation file(s); no GitHub-hosted images found.`
		);
	}

	process.exit( 0 );
}

// Run as a CLI only when executed directly, not when imported by tests.
if (
	process.argv[ 1 ] &&
	process.argv[ 1 ].endsWith( 'check-doc-image-hosting.mjs' )
) {
	main();
}
