/**
 * Internal dependencies
 */

import { replace } from './replace';

/**
 * Split a Rich Text value in two at the given `startIndex` and `endIndex`, or
 * split at the given separator. This is similar to `String.prototype.split`.
 * Indices are retrieved from the selection if none are provided.
 *
 * @param {Object}        value
 * @param {Object[]}      value.formats
 * @param {Object[]}      value.replacements
 * @param {string}        value.text
 * @param {number}        value.start
 * @param {number}        value.end
 * @param {number|string} [string] Start index, or string at which to split.
 *
 * @return {Array} An array of new values.
 */
export function split( { formats, replacements, text, start, end }, string ) {
	if ( typeof string !== 'string' ) {
		return splitAtSelection( ...arguments );
	}

	let nextStart = 0;

	return text.split( string ).map( ( substring ) => {
		const startIndex = nextStart;
		const value = {
			formats: formats.slice( startIndex, startIndex + substring.length ),
			replacements: replacements.slice( startIndex, startIndex + substring.length ),
			text: substring,
		};

		nextStart += string.length + substring.length;

		if ( start !== undefined && end !== undefined ) {
			if ( start >= startIndex && start < nextStart ) {
				value.start = start - startIndex;
			} else if ( start < startIndex && end > startIndex ) {
				value.start = 0;
			}

			if ( end >= startIndex && end < nextStart ) {
				value.end = end - startIndex;
			} else if ( start < nextStart && end > nextStart ) {
				value.end = substring.length;
			}
		}

		return value;
	} );
}

function splitAtSelection(
	{ formats, replacements, text, start, end },
	startIndex = start,
	endIndex = end
) {
	const before = {
		formats: formats.slice( 0, startIndex ),
		replacements: replacements.slice( 0, startIndex ),
		text: text.slice( 0, startIndex ),
	};
	const after = {
		formats: formats.slice( endIndex ),
		replacements: replacements.slice( endIndex ),
		text: text.slice( endIndex ),
		start: 0,
		end: 0,
	};

	return [
		// Ensure newlines are trimmed.
		replace( before, /\u2028+$/, '' ),
		replace( after, /^\u2028+/, '' ),
	];
}
