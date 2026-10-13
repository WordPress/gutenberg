import type { RichTextContent, RichTextValue } from './types';

/**
 * Split a Rich Text value in two at the given `startIndex` and `endIndex`, or
 * split at the given separator. This is similar to `String.prototype.split`.
 * Indices are retrieved from the selection if none are provided.
 *
 * @param richTextValue Value to split.
 * @param [string]      Start index, or string at which to split.
 * @param [endIndex]    End index, when splitting at indices.
 *
 * @return An array of new values.
 */
export function split(
	richTextValue: RichTextValue,
	string?: number | string,
	endIndex?: number
) {
	if ( typeof string !== 'string' ) {
		return splitAtSelection( richTextValue, string, endIndex );
	}

	const { formats, replacements, text, start, end } = richTextValue;

	let nextStart = 0;

	return text.split( string ).map( ( substring ) => {
		const startIndex = nextStart;
		const value: RichTextContent & { start?: number; end?: number } = {
			formats: formats.slice( startIndex, startIndex + substring.length ),
			replacements: replacements.slice(
				startIndex,
				startIndex + substring.length
			),
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

		return value as RichTextValue;
	} );
}

function splitAtSelection(
	{ formats, replacements, text, start, end }: RichTextValue,
	startIndex = start,
	endIndex = end
) {
	if ( start === undefined || end === undefined ) {
		return;
	}

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

	return [ before, after ] as RichTextValue[];
}
