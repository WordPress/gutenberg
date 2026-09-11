/**
 * Phase 1 of the overlay-retirement work (#73411): close the deletion seam.
 *
 * The legacy deletion handler only marks single-character backward/forward
 * deletes at a collapsed caret; word- and line-deletes (`deleteWordBackward`,
 * `deleteHardLineForward`, ...) fall through to the overlay diff path. Because
 * the handler cancels the native edit and writes the marker itself, it needs the
 * exact character range the delete would have removed. This computes that range
 * from the value's plain text and the caret, in rich-text offset space, so no
 * DOM-range mapping is needed. Marking (rather than removing) means an
 * approximate word boundary is a cosmetic nuance, never data loss.
 */

// Rich text uses a non-breaking space (\u00A0) for a trailing/collapsing
// space, so treat it as whitespace for word-boundary detection.
const isSpace = ( ch: string ) => ch === ' ' || ch === '\t' || ch === '\u00A0';
const isNewline = ( ch: string ) => ch === '\n';

/**
 * The collapsed-caret delete input types this resolves a range for, and whether
 * each grows backward (toward 0) or forward (toward the end).
 */
const BACKWARD = new Set( [
	'deleteContentBackward',
	'deleteWordBackward',
	'deleteSoftLineBackward',
	'deleteHardLineBackward',
] );
const FORWARD = new Set( [
	'deleteContentForward',
	'deleteWordForward',
	'deleteSoftLineForward',
	'deleteHardLineForward',
] );

/**
 * Resolve the character range a collapsed-caret delete would remove.
 *
 * @param text      Plain text of the value.
 * @param caret     Caret offset.
 * @param inputType `beforeinput` inputType (a `delete*` variant).
 * @return The range, or null when nothing would be removed.
 */
export function computeDeleteRange(
	text: any,
	caret: number,
	inputType: string
): { start: number; end: number } | null {
	if ( typeof text !== 'string' ) {
		return null;
	}

	const backward = BACKWARD.has( inputType );
	const forward = FORWARD.has( inputType );
	if ( ! backward && ! forward ) {
		return null;
	}

	const length = text.length;
	const pos = Math.max( 0, Math.min( caret, length ) );
	// Nothing to remove at the edge in the delete direction.
	if ( ( backward && pos <= 0 ) || ( forward && pos >= length ) ) {
		return null;
	}

	const isWord = inputType.startsWith( 'deleteWord' );
	const isLine =
		inputType.startsWith( 'deleteSoftLine' ) ||
		inputType.startsWith( 'deleteHardLine' );

	let start;
	let end;

	if ( backward ) {
		end = pos;
		if ( isWord ) {
			let i = pos;
			while ( i > 0 && isSpace( text[ i - 1 ] ) ) {
				i--;
			}
			while (
				i > 0 &&
				! isSpace( text[ i - 1 ] ) &&
				! isNewline( text[ i - 1 ] )
			) {
				i--;
			}
			start = i;
		} else if ( isLine ) {
			let i = pos;
			while ( i > 0 && ! isNewline( text[ i - 1 ] ) ) {
				i--;
			}
			start = i;
		} else {
			start = pos - 1;
		}
	} else {
		start = pos;
		if ( isWord ) {
			let i = pos;
			while ( i < length && isSpace( text[ i ] ) ) {
				i++;
			}
			while (
				i < length &&
				! isSpace( text[ i ] ) &&
				! isNewline( text[ i ] )
			) {
				i++;
			}
			end = i;
		} else if ( isLine ) {
			let i = pos;
			while ( i < length && ! isNewline( text[ i ] ) ) {
				i++;
			}
			end = i;
		} else {
			end = pos + 1;
		}
	}

	if ( start >= end ) {
		return null;
	}
	return { start, end };
}
