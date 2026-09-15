/**
 * Assertions about which files an agent actually read.
 *
 * These assert against what the `metadata.toolCalls` returned from Promptfoo.
 *
 * @see https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/
 */
import fs from 'node:fs';
import path from 'node:path';
import { sourceRoot } from '../lib/paths.js';

// Enough of a line to be distinctive. Shorter ones — a brace, a bare word —
// turn up in unrelated output and would pass without the file being read.
const MINIMUM_LANDMARK_LENGTH = 12;

// Spread through the file rather than taken from one end, so output that
// stops early is missing one.
const LANDMARK_COUNT = 5;

/**
 * Picks lines that only appear if the file was read through.
 *
 * @param {string} contents The file.
 * @return {string[]} Lines to look for, first and last included.
 */
function landmarks( contents ) {
	// Lines long enough to be distinctive, deduplicated so a line that repeats
	// cannot stand in for two places in the file.
	const lines = [
		...new Set(
			contents
				.split( '\n' )
				.map( ( line ) => line.trim() )
				.filter( ( line ) => line.length >= MINIMUM_LANDMARK_LENGTH )
		),
	];

	// A short file has nothing to sample; ask for all of it.
	if ( lines.length <= LANDMARK_COUNT ) {
		return lines;
	}

	// Evenly spaced, so the first and last are always among them and output
	// that stops anywhere in between is missing one.
	const step = ( lines.length - 1 ) / ( LANDMARK_COUNT - 1 );
	return Array.from(
		{ length: LANDMARK_COUNT },
		( _, index ) => lines[ Math.round( index * step ) ]
	);
}

/**
 * Prepares a file for both assertions below.
 *
 * @param {string} file Repository-relative path.
 * @return {{ match: string, landmarks: string[] }} How to spot it, and proof.
 */
function reference( file ) {
	const contents = fs.readFileSync( path.join( sourceRoot, file ), 'utf8' );
	const found = landmarks( contents );

	if ( ! found.length ) {
		throw new Error(
			`${ file } has no line long enough to prove it was read.`
		);
	}

	return {
		// The workspace generates its skills into `.claude/skills` from
		// `.agents/skills`, so a path is matched from the part both share.
		// Anchoring on either prefix would silently match nothing.
		match: file.replace( /^\.(agents|claude)\//, '' ),
		landmarks: found,
	};
}

/**
 * Every call that returned some of the file, joined so a file read in pieces
 * still counts as read.
 *
 * @param {Object} context Assertion context.
 * @param {string} match   Path fragment identifying the file.
 * @return {Object}          What came back.
 */
function readBack( context, match ) {
	const calls = context.metadata?.toolCalls || [];
	const matchingCalls = calls.filter( ( tool ) =>
		JSON.stringify( tool.input ).includes( match )
	);

	return {
		// Keep the path match only for diagnostics. A command can read a file
		// without naming it, for example after `cd` or through a glob.
		attempts: matchingCalls.length,
		successfulAttempts: matchingCalls.filter( ( call ) => ! call.is_error )
			.length,
		// Scan every successful tool result for content evidence. Promptfoo can
		// truncate long results, so a large file may need several reads for all
		// landmarks to survive in metadata.
		output: calls
			.filter( ( call ) => ! call.is_error )
			.map( ( call ) => String( call.output ) )
			.join( '\n' ),
		// Failed calls included: a command can return the file's contents and
		// still exit non-zero (`cat file; false`), which is a read all the same.
		allOutput: calls.map( ( call ) => String( call.output ) ).join( '\n' ),
	};
}

/**
 * Asserts the agent read a file through.
 *
 * @param {string} file   Repository-relative path.
 * @param {string} metric Name for the result column.
 * @return {Object} A Promptfoo assertion.
 */
export function assertRead( file, metric ) {
	const { match, landmarks: expected } = reference( file );

	return {
		type: 'javascript',
		value: ( output, context ) => {
			const {
				attempts,
				successfulAttempts,
				output: read,
			} = readBack( context, match );
			const missing = expected.filter(
				( landmark ) => ! read.includes( landmark )
			);
			const found = expected.length - missing.length;

			if ( ! attempts && ! found ) {
				return {
					pass: false,
					score: 0,
					reason: `Never opened ${ file }`,
				};
			}

			if ( attempts && ! successfulAttempts && ! found ) {
				return {
					pass: false,
					score: 0,
					reason: `Every read of ${ file } failed`,
				};
			}

			// Scored by how much of the file came back, so the metric
			// separates an agent that skims the guidance from one that
			// ignores it. Passing still needs all of it.
			return {
				pass: ! missing.length,
				score: found / expected.length,
				reason: missing.length
					? `Read ${ found } of ${
							expected.length
					  } landmarks in ${ file }, missing "${ missing[ 0 ].slice(
							0,
							40
					  ) }"`
					: `Read ${ file } through`,
			};
		},
		metric,
	};
}

/**
 * Asserts the agent did not read a file.
 *
 * Naming a file is not reading it, so this looks for its contents coming back
 * rather than for the path appearing in a command.
 *
 * @param {string} file   Repository-relative path.
 * @param {string} metric Name for the result column.
 * @return {Object} A Promptfoo assertion.
 */
export function assertNotRead( file, metric ) {
	const { landmarks: expected } = reference( file );

	return {
		type: 'javascript',
		value: ( output, context ) => {
			// The permissive scan: proving a file was left alone means no
			// output may carry its contents, a failed call's included.
			const { allOutput: read } = readBack( context, '' );
			const seen = expected.filter( ( landmark ) =>
				read.includes( landmark )
			);

			return {
				pass: ! seen.length,
				score: seen.length ? 0 : 1,
				reason: seen.length
					? `Read ${ file }, from "${ seen[ 0 ].slice( 0, 40 ) }"`
					: `Left ${ file } alone`,
			};
		},
		metric,
	};
}
