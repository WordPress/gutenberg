/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { getLineIndex } from './get-line-index';
import { canIndentListItems } from './can-indent-list-items';

/**
 * Gets the line index of the first previous list item with higher indentation.
 *
 * @param {Object} value      Value to search.
 * @param {number} lineIndex  Line index of the list item to compare with.
 *
 * @return {boolean} The line index.
 */
function getTargetLevelLineIndex( { text, replacements }, lineIndex ) {
	const startFormats = replacements[ lineIndex ] || [];

	let index = lineIndex;

	while ( index-- >= 0 ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		const formatsAtIndex = replacements[ index ] || [];

		// Return the first line index that is one level higher. If the level is
		// lower or equal, there is no result.
		if ( formatsAtIndex.length === startFormats.length + 1 ) {
			return index;
		} else if ( formatsAtIndex.length <= startFormats.length ) {
			return;
		}
	}
}

/**
 * Indents any selected list items if possible.
 *
 * @param {Object} value      Value to change.
 * @param {Object} rootFormat Root format.
 *
 * @return {Object} The changed value.
 */
export function indentListItems( value, rootFormat ) {
	if ( ! canIndentListItems( value ) ) {
		return value;
	}

	const lineIndex = getLineIndex( value );
	const previousLineIndex = getLineIndex( value, lineIndex );
	const { text, replacements, end } = value;
	const newFormats = replacements.slice();
	const targetLevelLineIndex = getTargetLevelLineIndex( value, lineIndex );

	for ( let index = lineIndex; index < end; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		// Get the previous list, and if there's a child list, take over the
		// formats. If not, duplicate the last level and create a new level.
		if ( targetLevelLineIndex ) {
			const targetFormats = replacements[ targetLevelLineIndex ] || [];
			newFormats[ index ] = targetFormats.concat(
				( newFormats[ index ] || [] ).slice( targetFormats.length - 1 )
			);
		} else {
			const targetFormats = replacements[ previousLineIndex ] || [];
			const lastformat = targetFormats[ targetFormats.length - 1 ] || rootFormat;

			newFormats[ index ] = targetFormats.concat(
				[ lastformat ],
				( newFormats[ index ] || [] ).slice( targetFormats.length )
			);
		}
	}

	return {
		...value,
		replacements: newFormats,
	};
}
