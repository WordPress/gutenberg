/**
 * External dependencies
 */
import { diffChars } from 'diff/lib/diff/character.js';
import { diffLines } from 'diff/lib/diff/line.js';

// Character diffing (Myers) is cheap when the edit distance is small but
// degrades toward O(n^2) as the two strings diverge: a full replacement of
// ~10k differing chars blocks the main thread for seconds. Cap the input handed
// to diffChars so the worst case stays small (~100ms); larger windows fall back
// to a line diff, with the cursor remapped by getCursorOffsetFromCommonText...
const STRING_TOO_LARGE_THRESHOLD = 1000;

/**
 * Diffs two strings into a list of `{ value, added?, removed? }` change parts.
 *
 * @param {string} oldValue The previous string.
 * @param {string} newValue The next string.
 * @return {Array<Object>} The diff change parts.
 */
export function getDiff( oldValue, newValue ) {
	const maxStringLength = Math.max( oldValue.length, newValue.length );

	if ( maxStringLength <= STRING_TOO_LARGE_THRESHOLD ) {
		return diffChars( oldValue, newValue );
	}

	let start = 0;
	const minStringLength = Math.min( oldValue.length, newValue.length );

	while (
		start < minStringLength &&
		oldValue[ start ] === newValue[ start ]
	) {
		start++;
	}

	let oldEnd = oldValue.length;
	let newEnd = newValue.length;

	while (
		oldEnd > start &&
		newEnd > start &&
		oldValue[ oldEnd - 1 ] === newValue[ newEnd - 1 ]
	) {
		oldEnd--;
		newEnd--;
	}

	const oldChangedValue = oldValue.slice( start, oldEnd );
	const newChangedValue = newValue.slice( start, newEnd );
	const maxChangedStringLength = Math.max(
		oldChangedValue.length,
		newChangedValue.length
	);
	let changes;

	if ( maxChangedStringLength <= STRING_TOO_LARGE_THRESHOLD ) {
		changes = diffChars( oldChangedValue, newChangedValue );
	} else {
		changes = diffLines( oldChangedValue, newChangedValue );
	}

	if ( start > 0 ) {
		changes.unshift( { value: oldValue.slice( 0, start ) } );
	}

	if ( oldEnd < oldValue.length ) {
		changes.push( { value: oldValue.slice( oldEnd ) } );
	}

	return changes;
}

function clampCursorPosition( position, value ) {
	return Math.max( 0, Math.min( value.length, position ) );
}

// A coarse (line-level) diff reports a whole changed region as one replacement,
// which would otherwise snap the cursor to the region's end. Recover a precise
// position by finding the longest run of text ending at the cursor that is
// preserved in the replacement, then placing the cursor just past where that
// run starts in the new text. This uses indexOf (near-linear in V8) rather than
// a character diff, so it stays cheap even across a large single-line region.
function getCursorOffsetFromCommonTextBeforeCursor(
	oldValue,
	newValue,
	position
) {
	const oldValueBeforeCursor = oldValue.slice( 0, position );
	let low = 1;
	let high = oldValueBeforeCursor.length;
	let cursorOffset;

	while ( low <= high ) {
		const length = Math.floor( ( low + high ) / 2 );
		const index = newValue.indexOf(
			oldValueBeforeCursor.slice( oldValueBeforeCursor.length - length )
		);

		if ( index === -1 ) {
			high = length - 1;
		} else {
			cursorOffset = index + length;
			low = length + 1;
		}
	}

	return cursorOffset;
}

/**
 * Maps a cursor position from the old string to the new string given a diff.
 *
 * @param {number}        position The cursor position in the old string.
 * @param {Array<Object>} changes  The diff returned by `getDiff`.
 * @param {string}        oldValue The previous string.
 * @param {string}        newValue The next string.
 * @return {number} The adjusted cursor position in the new string.
 */
export function adjustPosition( position, changes, oldValue, newValue ) {
	let oldIndex = 0;
	let newIndex = 0;
	let adjustedPosition = position;

	for ( let i = 0; i < changes.length; i++ ) {
		const change = changes[ i ];
		if ( ! change.added && ! change.removed ) {
			oldIndex += change.value.length;
			newIndex += change.value.length;
			continue;
		}

		const oldStart = oldIndex;
		const newStart = newIndex;
		let oldLength = 0;
		let newLength = 0;

		while (
			i < changes.length &&
			( changes[ i ].added || changes[ i ].removed )
		) {
			if ( changes[ i ].removed ) {
				oldLength += changes[ i ].value.length;
			} else {
				newLength += changes[ i ].value.length;
			}
			i++;
		}
		i--;

		const oldEnd = oldStart + oldLength;
		const newEnd = newStart + newLength;

		if ( position < oldStart ) {
			// The cursor is before this change, so nothing here can move it.
			break;
		}

		if ( oldLength === 0 ) {
			// Pure insertion at or before the cursor: shift it right by the
			// inserted length.
			adjustedPosition += newLength;
		} else if ( position <= oldEnd ) {
			// The cursor falls inside a replaced region; recover its precise
			// spot from the text preserved around it.
			const cursorOffset = getCursorOffsetFromCommonTextBeforeCursor(
				oldValue.slice( oldStart, oldEnd ),
				newValue.slice( newStart, newEnd ),
				position - oldStart
			);

			adjustedPosition =
				cursorOffset === undefined ? newEnd : newStart + cursorOffset;
			break;
		} else {
			// The cursor is after this change: shift it by the net length delta.
			adjustedPosition += newLength - oldLength;
		}

		oldIndex += oldLength;
		newIndex += newLength;
	}

	return clampCursorPosition( adjustedPosition, newValue );
}

/**
 * Diffs `oldValue` against `newValue` and maps a cursor `position` from the old
 * string to the new one.
 *
 * @param {number} position The cursor position in the old string.
 * @param {string} oldValue The previous string.
 * @param {string} newValue The next string.
 * @return {number} The adjusted cursor position in the new string.
 */
export function getAdjustedCursorPosition( position, oldValue, newValue ) {
	return adjustPosition(
		position,
		getDiff( oldValue, newValue ),
		oldValue,
		newValue
	);
}
