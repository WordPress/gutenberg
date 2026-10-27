/**
 * Generate a Markdown-formatted list of experimental APIs found across our
 * packages and lib, providing GitHub search links for each match.
 *
 * Experimental APIs must be regularly audited, particularly in the context of
 * major WordPress releases. This script allows release leads to generate a list
 * to share in release issues.
 *
 * @see example audit issue for WordPress 6.2:
 * https://github.com/WordPress/gutenberg/issues/47196
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const SOURCE_EXTENSIONS = new Set( [ '.js', '.ts', '.jsx', '.tsx', '.php' ] );
const EXPERIMENTAL_API = /__experimental\w+/g;

/**
 * Lists the tracked sources to scan. Git is the only binary this script needs:
 * it already knows which files are ours, ignored build output left out.
 *
 * @return Repository-relative paths.
 */
function sourceFiles(): string[] {
	const output = execFileSync(
		'git',
		[ 'ls-files', '-z', 'packages', 'lib' ],
		{ cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: Infinity }
	);

	return output
		.split( '\0' )
		.filter(
			( file ) =>
				SOURCE_EXTENSIONS.has( path.extname( file ) ) &&
				! file.includes( '__tests__' )
		);
}

/**
 * Attributes a file to the package that owns it.
 *
 * @param file Repository-relative path.
 * @return Package directory, or `lib` for the plugin's PHP.
 */
function namespaceOf( file: string ): string {
	const [ first, second ] = file.split( '/' );
	return first === 'lib' ? 'lib' : `${ first }/${ second }`;
}

/**
 * Reads a file the index still lists. A path deleted from the working tree but
 * not yet staged is reported and skipped, as `grep` skipped it in the shell
 * script this replaces, so a dirty checkout still gets the full list.
 *
 * @param file Repository-relative path.
 * @return File contents, or `undefined` when it could not be read.
 */
function readSource( file: string ): string | undefined {
	try {
		return readFileSync( path.join( REPO_ROOT, file ), 'utf8' );
	} catch ( error ) {
		const reason = error instanceof Error ? error.message : String( error );
		process.stderr.write( `Skipped ${ file }: ${ reason }\n` );
		return undefined;
	}
}

/**
 * Orders strings by code unit, which is what `sort` does under `LC_ALL=C`. The
 * shell script this replaces used the caller's locale instead, so its output
 * varied by environment.
 *
 * @param a First string.
 * @param b Second string.
 * @return Negative when `a` sorts first, positive when `b` does, else zero.
 */
function byCodeUnit( a: string, b: string ): number {
	if ( a === b ) {
		return 0;
	}
	return a < b ? -1 : 1;
}

/**
 * Collects every experimental API with the package it was found in. An API
 * exported by one package and consumed by another is reported once, under
 * whichever package sorts first.
 *
 * @return `[ namespace, api ]` pairs, sorted by package and then by API.
 */
function experimentalApis(): [ string, string ][] {
	const owners = new Map< string, string >();

	for ( const file of sourceFiles() ) {
		const source = readSource( file );
		if ( source === undefined ) {
			continue;
		}

		const namespace = namespaceOf( file );
		for ( const [ api ] of source.matchAll( EXPERIMENTAL_API ) ) {
			const owner = owners.get( api );
			if ( owner === undefined || namespace < owner ) {
				owners.set( api, namespace );
			}
		}
	}

	return [ ...owners ]
		.map( ( [ api, namespace ] ): [ string, string ] => [ namespace, api ] )
		.sort(
			( [ aNamespace, aApi ], [ bNamespace, bApi ] ) =>
				byCodeUnit( aNamespace, bNamespace ) || byCodeUnit( aApi, bApi )
		);
}

let previousNamespace: string | undefined;
let output = '';

for ( const [ namespace, api ] of experimentalApis() ) {
	if ( previousNamespace !== namespace ) {
		output += `${ previousNamespace ? '\n' : '' }## \`${ namespace }\`\n`;
		previousNamespace = namespace;
	}
	output += `[\`${ api }\`](/WordPress/gutenberg/search?q=${ api })\n`;
}

process.stdout.write( output );
