/**
 * Internal dependencies
 */
import {
	defineFormatsAccessor,
	mapFromFormats,
	sliceFormats,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Split a Rich Text value in two at the given `startIndex` and `endIndex`, or
 * split at the given separator. This is similar to `String.prototype.split`.
 * Indices are retrieved from the selection if none are provided.
 *
 * @param {RichTextValue} value
 * @param {number|string} [string] Start index, or string at which to split.
 *
 * @return {Array<RichTextValue>|undefined} An array of new values.
 */
export function split( value, string ) {
	if ( typeof string !== 'string' ) {
		return splitAtSelection( ...arguments );
	}

	const { replacements, text, start, end } = value;
	const sourceFormats = value._formats || mapFromFormats( value.formats );
	let nextStart = 0;

	return text.split( string ).map( ( substring ) => {
		const startIndex = nextStart;
		const out = defineFormatsAccessor( {
			_formats: sliceFormats(
				sourceFormats,
				startIndex,
				startIndex + substring.length
			),
			replacements: replacements.slice(
				startIndex,
				startIndex + substring.length
			),
			text: substring,
		} );

		nextStart += string.length + substring.length;

		if ( start !== undefined && end !== undefined ) {
			if ( start >= startIndex && start < nextStart ) {
				out.start = start - startIndex;
			} else if ( start < startIndex && end > startIndex ) {
				out.start = 0;
			}

			if ( end >= startIndex && end < nextStart ) {
				out.end = end - startIndex;
			} else if ( start < nextStart && end > nextStart ) {
				out.end = substring.length;
			}
		}

		return out;
	} );
}

function splitAtSelection(
	value,
	startIndex = value.start,
	endIndex = value.end
) {
	if ( value.start === undefined || value.end === undefined ) {
		return;
	}

	const { replacements, text } = value;
	const sourceFormats = value._formats || mapFromFormats( value.formats );
	const before = defineFormatsAccessor( {
		_formats: sliceFormats( sourceFormats, 0, startIndex ),
		replacements: replacements.slice( 0, startIndex ),
		text: text.slice( 0, startIndex ),
	} );
	const after = defineFormatsAccessor( {
		_formats: sliceFormats( sourceFormats, endIndex ),
		replacements: replacements.slice( endIndex ),
		text: text.slice( endIndex ),
		start: 0,
		end: 0,
	} );

	return [ before, after ];
}
