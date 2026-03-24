/**
 * Cursor-aware string diff that produces lib0 deltas.
 *
 * When a cursor position is provided, the diff output is adjusted so that
 * insertions and deletions are placed at the cursor rather than at whichever
 * boundary the raw character diff happens to pick (which is ambiguous for
 * repeated characters).  When no cursor is available, lib0's built-in
 * `delta.diff` is used directly.
 *
 * The cursor-adjustment logic was originally part of the quill-delta fork
 * shipped in this package and is described in detail in
 * https://github.com/WordPress/gutenberg/pull/72604.
 */

/**
 * External dependencies
 */
import type { Change } from 'diff';
import { diffChars } from 'diff';
import * as delta from 'lib0/delta';

type Lib0Delta = ReturnType< typeof delta.create >[ 'done' ] extends (
	...args: infer _A
) => infer R
	? R
	: never;

/**
 * Normalize diff changes so that `count` reflects UTF-16 code-unit length
 * rather than grapheme-cluster count (which diffChars may return when
 * Intl.Segmenter is available, e.g. diff v8+).
 *
 * @param changes - The array of changes from diffChars.
 * @return The changes with `count` normalized to UTF-16 code-unit length.
 */
function normalizeChangeCounts( changes: Change[] ): Change[] {
	return changes.map( ( change ) => ( {
		...change,
		count: change.value.length,
	} ) );
}

/**
 * Try to move an insertion from after an unchanged segment to the cursor
 * position within it (look-ahead strategy).
 *
 * @param diff              The current unchanged diff segment.
 * @param nextDiff          The next diff segment (expected to be an insertion).
 * @param cursorAfterChange The cursor position after the change.
 * @param segmentStart      The start position of the current segment.
 * @return Adjusted diff segments, or null if the move is not valid.
 */
function tryMoveInsertionToCursor(
	diff: Change,
	nextDiff: Change,
	cursorAfterChange: number,
	segmentStart: number
): Change[] | null {
	const nextDiffInsert = nextDiff.value;
	const insertLength = nextDiffInsert.length;
	const insertOffset = cursorAfterChange - segmentStart - insertLength;

	// Verify that the inserted text matches the text at the cursor position.
	const textAtCursor = diff.value.substring(
		insertOffset,
		insertOffset + nextDiffInsert.length
	);

	if ( textAtCursor !== nextDiffInsert ) {
		return null;
	}

	const beforeCursor = diff.value.substring( 0, insertOffset );
	const afterCursor = diff.value.substring( insertOffset );

	const result: Change[] = [];

	if ( beforeCursor.length > 0 ) {
		result.push( {
			value: beforeCursor,
			count: beforeCursor.length,
			added: false,
			removed: false,
		} );
	}

	result.push( nextDiff );

	if ( afterCursor.length > 0 ) {
		result.push( {
			value: afterCursor,
			count: afterCursor.length,
			added: false,
			removed: false,
		} );
	}

	return result;
}

/**
 * Try to move a deletion to the cursor position by looking back at the
 * previous unchanged segment (look-back strategy).
 *
 * @param diff              The current deletion diff segment.
 * @param adjustedDiffs     Previously processed diff segments.
 * @param cursorAfterChange The cursor position after the change.
 * @param lastDiffPosition  Position up to (but not including) the current diff.
 * @return Adjusted diff segments, or null if the move is not valid.
 */
function tryMoveDeletionToCursor(
	diff: Change,
	adjustedDiffs: Change[],
	cursorAfterChange: number,
	lastDiffPosition: number
): Change[] | null {
	const prevDiff = adjustedDiffs[ adjustedDiffs.length - 1 ];

	if ( ! prevDiff || prevDiff.added || prevDiff.removed ) {
		return null;
	}

	const prevSegmentStart = lastDiffPosition - ( prevDiff.count ?? 0 );
	const prevSegmentEnd = lastDiffPosition;

	if (
		cursorAfterChange < prevSegmentStart ||
		cursorAfterChange >= prevSegmentEnd
	) {
		return null;
	}

	const deletedChars = diff.value;
	const deleteOffset = cursorAfterChange - prevSegmentStart;
	const textAtCursor = prevDiff.value.substring(
		deleteOffset,
		deleteOffset + deletedChars.length
	);

	if ( textAtCursor !== deletedChars ) {
		return null;
	}

	const beforeCursor = prevDiff.value.substring( 0, deleteOffset );
	const atAndAfterCursor = prevDiff.value.substring( deleteOffset );
	const deletionLength = diff.count ?? 0;
	const afterDeletion = atAndAfterCursor.substring( deletionLength );

	const result: Change[] = [];

	if ( beforeCursor.length > 0 ) {
		result.push( {
			value: beforeCursor,
			count: beforeCursor.length,
			added: false,
			removed: false,
		} );
	}

	result.push( diff );

	if ( afterDeletion.length > 0 ) {
		result.push( {
			value: afterDeletion,
			count: afterDeletion.length,
			added: false,
			removed: false,
		} );
	}

	return result;
}

/**
 * Adjust raw diff changes so that insertions and deletions are placed at the
 * cursor position when the raw diff is ambiguous (e.g. repeated characters).
 *
 * @param changes           Raw changes from `diffChars`.
 * @param cursorAfterChange Cursor position in the *new* string.
 * @return Adjusted changes.
 */
function adjustChangesForCursor(
	changes: Change[],
	cursorAfterChange: number
): Change[] {
	let lastDiffPosition = 0;
	const adjustedDiffs: Change[] = [];

	for ( let i = 0; i < changes.length; i++ ) {
		const diff = changes[ i ];

		const segmentStart = lastDiffPosition;
		const segmentEnd = lastDiffPosition + ( diff.count ?? 0 );
		const isCursorInSegment =
			cursorAfterChange > segmentStart && cursorAfterChange <= segmentEnd;

		const isUnchangedSegment = ! diff.added && ! diff.removed;
		const isRemovalSegment = diff.removed && ! diff.added;

		const nextDiff = changes[ i + 1 ];
		const isNextDiffAnInsert =
			nextDiff && nextDiff.added && ! nextDiff.removed;

		// Path 1: Look-ahead strategy
		if ( isUnchangedSegment && isCursorInSegment && isNextDiffAnInsert ) {
			const movedSegments = tryMoveInsertionToCursor(
				diff,
				nextDiff,
				cursorAfterChange,
				segmentStart
			);

			if ( movedSegments ) {
				adjustedDiffs.push( ...movedSegments );
				i++;
				lastDiffPosition = segmentEnd;
				continue;
			}
		}

		// Path 2: Look-back strategy
		if ( isRemovalSegment ) {
			const movedSegments = tryMoveDeletionToCursor(
				diff,
				adjustedDiffs,
				cursorAfterChange,
				lastDiffPosition
			);

			if ( movedSegments ) {
				adjustedDiffs.pop();
				adjustedDiffs.push( ...movedSegments );
				lastDiffPosition += diff.count ?? 0;
				continue;
			}
		}

		// Path 3: No adjustment needed.
		adjustedDiffs.push( diff );
		if ( ! diff.added ) {
			lastDiffPosition += diff.count ?? 0;
		}
	}

	return adjustedDiffs;
}

/**
 * Convert an array of diff changes to a lib0 delta.
 *
 * @param changes The adjusted changes from diffChars.
 * @return A lib0 delta with retain/insert/delete ops.
 */
function changesToLib0Delta( changes: Change[] ): Lib0Delta {
	const builder = delta.create();
	for ( const change of changes ) {
		if ( change.added ) {
			builder.insert( change.value );
		} else if ( change.removed ) {
			builder.delete( change.count ?? change.value.length );
		} else {
			builder.retain( change.count ?? change.value.length );
		}
	}
	return builder.done();
}

/**
 * Compute the diff between two strings and return a lib0 delta.
 *
 * When `cursorAfterChange` is provided, the diff is adjusted so that
 * insertions and deletions are placed at the cursor position.  This is
 * important for collaborative editing where the raw character diff may place
 * changes at the wrong position for repeated characters.
 *
 * @param currentStr        The current string value.
 * @param updatedStr        The updated string value.
 * @param cursorAfterChange Cursor position in `updatedStr`, or null.
 * @return A lib0 delta that transforms `currentStr` into `updatedStr`.
 */
export function diffStringsToLib0Delta(
	currentStr: string,
	updatedStr: string,
	cursorAfterChange: number | null
): Lib0Delta {
	if ( currentStr === updatedStr ) {
		return delta.create().done();
	}

	// When no cursor position is provided, use lib0's built-in diff which
	// uses patience diff and operates on the native delta structure.
	if ( cursorAfterChange === null ) {
		const d1 = delta.create();
		d1.insert( currentStr );
		const d2 = delta.create();
		d2.insert( updatedStr );
		return delta.diff( d1.done(), d2.done() );
	}

	// With a cursor position, use diffChars and adjust for cursor placement.
	const changes = normalizeChangeCounts(
		diffChars( currentStr, updatedStr )
	);
	const adjusted = adjustChangesForCursor( changes, cursorAfterChange );
	return changesToLib0Delta( adjusted );
}
