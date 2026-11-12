#!/usr/bin/env node
/**
 * Search and validate WordPress Design System tokens.
 *
 * Reads the token data of the installed `@wordpress/theme` package, so the
 * results match the version in use. It only reads files: no network access
 * and no writes.
 *
 *   node tokens.mjs search <term...> [--limit <n>] [--json]
 *   node tokens.mjs check <name...> [--json]
 *
 * Requires Node.js 22.13 or later, like `@wordpress/theme`.
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {Record<string, { $description?: string, fallback?: string }>} TokenMap
 */

const DEFAULT_LIMIT = 15;
const MAX_SUGGESTIONS = 3;
const PREFIX = '--wpds-';

const USAGE = `Usage:
  node tokens.mjs search <term...> [--limit <n>] [--json]
  node tokens.mjs check <name...> [--json]

search  Find tokens whose name or description contains every term.
        Terms can be a property (background), a target (interactive),
        a tone (brand), or a word from the description (popover).
check   Verify that token names exist. Unknown names get suggestions.
        Exit code 1 when any name is unknown.`;

/**
 * Loads the token data of the installed `@wordpress/theme` package.
 *
 * It first tries the package that contains this skill, then the package
 * that the current project resolves, for a skill that was copied out of
 * `node_modules`.
 *
 * @return {Promise<Record<string, { $description?: string, $type?: string, group?: string, fallback?: string }>>} Tokens by name.
 */
async function loadTokens() {
	const candidates = [
		new URL( '../../../prebuilt/js/design-tokens.mjs', import.meta.url )
			.href,
	];
	try {
		const require = createRequire( path.join( process.cwd(), 'noop.cjs' ) );
		candidates.push(
			pathToFileURL(
				require.resolve( '@wordpress/theme/design-tokens.js' )
			).href
		);
	} catch {
		// `@wordpress/theme` is not resolvable from the project.
	}

	for ( const candidate of candidates ) {
		try {
			const { tokens } = await import( candidate );
			if ( tokens && typeof tokens === 'object' ) {
				return tokens;
			}
		} catch {
			// Try the next candidate.
		}
	}
	throw new Error(
		'Could not find the token data of @wordpress/theme. Install the package and run this script again.'
	);
}

/**
 * Normalizes user input such as `var(--wpds-color-x, #fff)` or
 * `color-x` to a full token name.
 *
 * @param {string} input Raw token reference.
 * @return {string} Token name with the `--wpds-` prefix.
 */
function normalizeName( input ) {
	let name = String( input ).trim();
	const varMatch = name.match( /^var\(\s*([^,)\s]+)/ );
	if ( varMatch ) {
		name = varMatch[ 1 ];
	}
	if ( name.startsWith( PREFIX ) ) {
		return name;
	}
	name = name.replace( /^-+/, '' ).replace( /^wpds-/, '' );
	return PREFIX + name;
}

/**
 * Splits a token name into its segments, without the prefix.
 *
 * @param {string} name Token name.
 * @return {string[]} Segments.
 */
function segmentsOf( name ) {
	return name.slice( PREFIX.length ).split( '-' ).filter( Boolean );
}

/**
 * Levenshtein distance between two strings.
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @return {number} Edit distance.
 */
function distance( a, b ) {
	let previous = Array.from( { length: b.length + 1 }, ( _, i ) => i );
	for ( let i = 1; i <= a.length; i++ ) {
		const current = [ i ];
		for ( let j = 1; j <= b.length; j++ ) {
			current[ j ] = Math.min(
				previous[ j ] + 1,
				current[ j - 1 ] + 1,
				previous[ j - 1 ] + ( a[ i - 1 ] === b[ j - 1 ] ? 0 : 1 )
			);
		}
		previous = current;
	}
	return previous[ b.length ];
}

/**
 * Describes a token for output.
 *
 * @param {string}                                       name  Token name.
 * @param {{ $description?: string, fallback?: string }} token Token data.
 * @return {{ name: string, description: string, value: string }} Summary.
 */
function summarize( name, token ) {
	return {
		name,
		description: token.$description ?? '',
		value: token.fallback ?? '',
	};
}

/**
 * @param {{ name: string, description: string, value: string }} item Summary.
 * @return {string} One line of text output.
 */
function formatLine( { name, description, value } ) {
	const details = [
		description.replace( /\.$/, '' ),
		value && `default: ${ value }`,
	]
		.filter( Boolean )
		.join( '. ' );
	return details ? `${ name }  ${ details }` : name;
}

/**
 * Finds tokens that contain every term in their name or description.
 *
 * @param {TokenMap} tokens Token data.
 * @param {string[]} terms  Search terms.
 * @return {{ name: string, description: string, value: string }[]} Matches, best first.
 */
function search( tokens, terms ) {
	const lowered = terms.map( ( term ) => term.toLowerCase() );
	const matches = [];
	for ( const [ name, token ] of Object.entries( tokens ) ) {
		const nameSegments = segmentsOf( name );
		const description = ( token.$description ?? '' ).toLowerCase();
		let nameHits = 0;
		let matchesAll = true;
		for ( const term of lowered ) {
			if ( nameSegments.includes( term ) ) {
				nameHits += 2;
			} else if ( name.includes( term ) ) {
				nameHits += 1;
			} else if ( ! description.includes( term ) ) {
				matchesAll = false;
				break;
			}
		}
		if ( matchesAll ) {
			matches.push( { name, nameHits } );
		}
	}
	return matches
		.sort(
			( a, b ) =>
				b.nameHits - a.nameHits || a.name.localeCompare( b.name )
		)
		.map( ( { name } ) => summarize( name, tokens[ name ] ) );
}

/**
 * Suggests the existing tokens that are closest to an unknown name.
 *
 * @param {TokenMap} tokens Token data.
 * @param {string}   name   Unknown token name.
 * @return {string[]} Up to three token names.
 */
function suggest( tokens, name ) {
	const wanted = segmentsOf( name );
	return Object.keys( tokens )
		.map( ( candidate ) => ( {
			candidate,
			shared: segmentsOf( candidate ).filter( ( segment ) =>
				wanted.includes( segment )
			).length,
			edits: distance( name, candidate ),
		} ) )
		.sort( ( a, b ) => b.shared - a.shared || a.edits - b.edits )
		.slice( 0, MAX_SUGGESTIONS )
		.map( ( { candidate } ) => candidate );
}

/**
 * @param {string[]} args Command line arguments after the command.
 * @return {{ positional: string[], limit: number, json: boolean }} Parsed options.
 */
function parseArgs( args ) {
	const positional = [];
	let limit = DEFAULT_LIMIT;
	let json = false;
	for ( let i = 0; i < args.length; i++ ) {
		if ( args[ i ] === '--json' ) {
			json = true;
		} else if ( args[ i ] === '--limit' ) {
			const value = Number.parseInt( args[ ++i ], 10 );
			if ( ! Number.isInteger( value ) || value < 1 ) {
				throw new Error( '--limit needs a positive number.' );
			}
			limit = value;
		} else {
			positional.push( args[ i ] );
		}
	}
	return { positional, limit, json };
}

/**
 * @param {string} text Text to print, followed by a newline.
 */
function print( text ) {
	process.stdout.write( text + '\n' );
}

async function main() {
	const args = process.argv.slice( 2 );
	const command = args[ 0 ];
	if ( ! command || command === '--help' || command === '-h' ) {
		print( USAGE );
		return 0;
	}
	if ( command !== 'search' && command !== 'check' ) {
		process.stderr.write( `Unknown command "${ command }".\n${ USAGE }\n` );
		return 2;
	}

	const parsed = parseArgs( args.slice( 1 ) );
	if ( ! parsed.positional.length ) {
		process.stderr.write( `Missing arguments.\n${ USAGE }\n` );
		return 2;
	}
	const { positional } = parsed;
	const tokens = await loadTokens();

	if ( command === 'search' ) {
		const matches = search( tokens, positional );
		if ( parsed.json ) {
			print(
				JSON.stringify( matches.slice( 0, parsed.limit ), null, 2 )
			);
			return 0;
		}
		if ( ! matches.length ) {
			print(
				`No tokens match "${ positional.join(
					' '
				) }". Try fewer or different terms.`
			);
			return 0;
		}
		matches
			.slice( 0, parsed.limit )
			.forEach( ( item ) => print( formatLine( item ) ) );
		if ( matches.length > parsed.limit ) {
			print(
				`… ${ matches.length - parsed.limit } more. Add terms to narrow the search, or use --limit.`
			);
		}
		return 0;
	}

	const results = positional.map( ( input ) => {
		const name = normalizeName( input );
		return name in tokens
			? {
					input,
					name,
					exists: true,
					...summarize( name, tokens[ name ] ),
				}
			: {
					input,
					name,
					exists: false,
					suggestions: suggest( tokens, name ),
				};
	} );
	if ( parsed.json ) {
		print( JSON.stringify( results, null, 2 ) );
	} else {
		for ( const result of results ) {
			if ( result.exists ) {
				print( `OK       ${ formatLine( result ) }` );
			} else {
				print(
					`UNKNOWN  ${ result.name }. Did you mean: ${ result.suggestions.join(
						', '
					) }`
				);
			}
		}
	}
	return results.every( ( result ) => result.exists ) ? 0 : 1;
}

main().then(
	( code ) => {
		process.exitCode = code;
	},
	( error ) => {
		process.stderr.write( `${ error.message }\n` );
		process.exitCode = 2;
	}
);
