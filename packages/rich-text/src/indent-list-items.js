/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { normaliseFormats } from './normalise-formats';
import { getLineIndex } from './get-line-index';

/**
 * Indents any selected list items if possible.
 *
 * @param {Object} value      Value to change.
 * @param {Object} rootFormat
 *
 * @return {Object} The changed value.
 */
export function indentListItems( value, rootFormat ) {
	const lineIndex = getLineIndex( value );

	// There is only one line, so the line cannot be indented.
	if ( lineIndex === undefined ) {
		return value;
	}

	const { text, formats, start, end } = value;
	const formatsAtLineIndex = formats[ lineIndex ] || [];
	const previousLineIndex = getLineIndex( value, lineIndex );
	const formatsAtPreviousLineIndex = formats[ previousLineIndex ] || [];

	// The the indentation of the current line is greater than previous line,
	// then the line cannot be furter indented.
	if ( formatsAtLineIndex.length > formatsAtPreviousLineIndex.length ) {
		return value;
	}

	const newFormats = formats.slice();
	const targetFormats = formats[ getLineIndex( value, lineIndex ) ] || [];

	for ( let index = lineIndex; index < end; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		// If the indentation of the previous line is the same as the current
		// line, then duplicate the type and append all current types. E.g.
		//
		// 1. one
		// 2. two <= Selected
		//   * three <= Selected
		//
		// should become:
		//
		// 1. one
		//   1. two <= Selected
		//     * three <= Selected
		//
		//   ^ Inserted list
		//
		// Otherwise take the target formats and append traling lists. E.g.
		//
		// 1. one
		//   * target
		// 2. two <= Selected
		//   * three <= Selected
		//
		// should become:
		//
		// 1. one
		//   * target
		//   * two <= Selected
		//     * three <= Selected
		//
		if ( targetFormats.length === formatsAtLineIndex.length ) {
			const lastformat = targetFormats[ targetFormats.length - 1 ] || rootFormat;

			newFormats[ index ] = targetFormats.concat(
				[ lastformat ],
				( newFormats[ index ] || [] ).slice( targetFormats.length )
			);
		} else {
			newFormats[ index ] = targetFormats.concat(
				( newFormats[ index ] || [] ).slice( targetFormats.length - 1 )
			);
		}
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
