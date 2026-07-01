/**
 * Grapheme-boundary helpers for offset arithmetic on rich-text plain text.
 *
 * Rich-text offsets count UTF-16 code units, but a user-perceived character
 * (grapheme cluster) can span several: surrogate pairs (emoji), ZWJ sequences
 * (family emoji), combining marks. Deleting "one character" by `pos - 1` lands
 * mid-grapheme for those, and `toHTMLString` then emits a lone surrogate that
 * renders as U+FFFD. These helpers snap offsets to grapheme boundaries.
 *
 * `Intl.Segmenter` (granularity `grapheme`) is used when available; otherwise
 * a minimal fallback steps over surrogate pairs only (ZWJ sequences and
 * combining marks then degrade to per-code-point steps, which is still valid
 * UTF-16 — no lone surrogates).
 */

let cachedSegmenter = null;

function getSegmenter() {
	if ( typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function' ) {
		return null;
	}
	if ( ! cachedSegmenter ) {
		cachedSegmenter = new Intl.Segmenter( undefined, {
			granularity: 'grapheme',
		} );
	}
	return cachedSegmenter;
}

const isHighSurrogate = ( code ) => code >= 0xd800 && code <= 0xdbff;
const isLowSurrogate = ( code ) => code >= 0xdc00 && code <= 0xdfff;

/**
 * The largest grapheme boundary strictly before `offset` — i.e. the start of
 * the grapheme containing `offset - 1`. Marking `[result, offset)` deletes one
 * user-perceived character backward.
 *
 * @param {string} text   Plain text (UTF-16 code units).
 * @param {number} offset Offset to step back from.
 * @return {number} Boundary offset, clamped to `[0, text.length]`.
 */
export function previousGraphemeBoundary( text, offset ) {
	if ( typeof text !== 'string' || offset <= 0 ) {
		return 0;
	}
	const clamped = Math.min( offset, text.length );
	const segmenter = getSegmenter();
	if ( segmenter ) {
		let previous = 0;
		for ( const { index } of segmenter.segment( text ) ) {
			if ( index >= clamped ) {
				break;
			}
			previous = index;
		}
		return previous;
	}
	// Fallback: step over a full surrogate pair.
	let position = clamped - 1;
	if (
		position > 0 &&
		isLowSurrogate( text.charCodeAt( position ) ) &&
		isHighSurrogate( text.charCodeAt( position - 1 ) )
	) {
		position -= 1;
	}
	return position;
}

/**
 * The smallest grapheme boundary strictly after `offset` — i.e. the end of the
 * grapheme containing `offset`. Marking `[offset, result)` deletes one
 * user-perceived character forward.
 *
 * @param {string} text   Plain text (UTF-16 code units).
 * @param {number} offset Offset to step forward from.
 * @return {number} Boundary offset, clamped to `[0, text.length]`.
 */
export function nextGraphemeBoundary( text, offset ) {
	if ( typeof text !== 'string' ) {
		return 0;
	}
	if ( offset >= text.length ) {
		return text.length;
	}
	const clamped = Math.max( 0, offset );
	const segmenter = getSegmenter();
	if ( segmenter ) {
		for ( const { index } of segmenter.segment( text ) ) {
			if ( index > clamped ) {
				return index;
			}
		}
		return text.length;
	}
	// Fallback: step over a full surrogate pair.
	let position = clamped + 1;
	if (
		position < text.length &&
		isHighSurrogate( text.charCodeAt( clamped ) ) &&
		isLowSurrogate( text.charCodeAt( clamped + 1 ) )
	) {
		position += 1;
	}
	return position;
}
