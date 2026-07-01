/**
 * Phase 2 of the overlay-retirement work (#73411): inline formatting -> marks.
 *
 * A format-only edit (bold/italic/link toggled over a run, the text itself
 * unchanged) is modelled as a paired suggestion, the same shape a type-over
 * uses for text: the prior run is wrapped in a `del` marker (kept, struck
 * through) and a copy carrying the new format is inserted right after it as an
 * `add` marker. Accepting removes the `del` text and unwraps the `add`
 * (formatted run stays); rejecting unwraps the `del` (original stays) and drops
 * the `add`.
 *
 * This module is the pure engine only: it detects the format delta and plans /
 * applies the markers against rich-text values. It does not touch the store or
 * create notes — the caller wires those, exactly as `reconcile-edit.js` is
 * wired for text edits. `analyzeTextEdit` sees no text change for a format-only
 * edit, so format detection needs this separate pass.
 */
/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	slice,
	insert,
	applyFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_ADDITION,
} from './format';
import { buildSuggestionMarkerAttributes } from './operations';

/**
 * Parse a block attribute value into a rich-text record, tolerating plain
 * strings and other non-rich values.
 *
 * @param {*} value Block attribute value.
 * @return {?Object} Rich-text record, or null when the value isn't rich text.
 */
function toRecord( value ) {
	if ( value instanceof RichTextData ) {
		return create( { html: value.toHTMLString() } );
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } );
	}
	return null;
}

/**
 * Stable key for a rich-text format so two format instances compare equal when
 * they are the same type with the same attributes (a link and its href, a
 * text-color and its value). Attribute keys are sorted so key order doesn't
 * affect equality.
 *
 * @param {Object} format Rich-text format ({ type, attributes? }).
 * @return {string} Comparison key.
 */
function formatKey( format ) {
	const attributes = format.attributes ?? {};
	const parts = Object.keys( attributes )
		.sort()
		.map( ( name ) => `${ name }=${ attributes[ name ] }` );
	return `${ format.type }(${ parts.join( ',' ) })`;
}

/**
 * Comparison key for a character's whole format stack, excluding the suggestion
 * marker itself (so a value that already carries markers isn't seen as
 * "different" only because of them, and re-running is stable). Sorted so stack
 * order doesn't matter.
 *
 * @param {Array} stack Per-character format stack (may be undefined).
 * @return {string} Comparison key for the stack.
 */
function stackKey( stack ) {
	if ( ! Array.isArray( stack ) ) {
		return '';
	}
	return stack
		.filter( ( f ) => f.type !== SUGGESTION_FORMAT_NAME )
		.map( formatKey )
		.sort()
		.join( '|' );
}

/**
 * Detect a format-only edit and return the contiguous character range whose
 * formatting changed. Returns null when the text differs (that is a text edit,
 * handled by `reconcile-edit.js`, not here) or when no formatting changed.
 *
 * A single contiguous span from the first to the last differing character is
 * returned; toggling two disjoint runs in one edit over-selects the unchanged
 * middle, which marks a slightly wider run but never corrupts content. The
 * common case — toggling one selection — is exact.
 *
 * @param {*} prevValue Value before the edit.
 * @param {*} nextValue Value after the edit.
 * @return {?{start: number, end: number}} Changed range, or null.
 */
export function analyzeFormatEdit( prevValue, nextValue ) {
	const prev = toRecord( prevValue );
	const next = toRecord( nextValue );
	if ( ! prev || ! next ) {
		return null;
	}
	// A different text length or content is a text edit, not a format edit.
	if ( prev.text !== next.text ) {
		return null;
	}
	const length = prev.text.length;
	let start = -1;
	let end = -1;
	for ( let i = 0; i < length; i++ ) {
		if (
			stackKey( prev.formats?.[ i ] ) !== stackKey( next.formats?.[ i ] )
		) {
			if ( start === -1 ) {
				start = i;
			}
			end = i + 1;
		}
	}
	if ( start === -1 ) {
		return null;
	}
	return { start, end };
}

/**
 * Whether any character in `[start, end)` already carries a suggestion marker in
 * either value. A format change overlapping an open suggestion is left alone
 * rather than nesting a marker inside another suggestion.
 *
 * @param {Object} prev  Previous record.
 * @param {Object} next  Next record.
 * @param {number} start Range start.
 * @param {number} end   Range end.
 * @return {boolean} True when the range touches an existing marker.
 */
function overlapsExistingMarker( prev, next, start, end ) {
	for ( let i = start; i < end; i++ ) {
		const inPrev = prev.formats?.[ i ]?.some(
			( f ) => f.type === SUGGESTION_FORMAT_NAME
		);
		const inNext = next.formats?.[ i ]?.some(
			( f ) => f.type === SUGGESTION_FORMAT_NAME
		);
		if ( inPrev || inNext ) {
			return true;
		}
	}
	return false;
}

/**
 * Plan the markers for a format-only edit. Two notes are needed (a `del` for the
 * prior run and an `add` for the reformatted run), mirroring a text type-over.
 *
 * @param {*} prevValue Value before the edit.
 * @param {*} nextValue Value after the edit.
 * @return {{ kind: 'format'|'none', range?: {start:number, end:number} }} Plan.
 */
export function planFormatMarkers( prevValue, nextValue ) {
	const prev = toRecord( prevValue );
	const next = toRecord( nextValue );
	if ( ! prev || ! next ) {
		return { kind: 'none' };
	}
	const range = analyzeFormatEdit( prevValue, nextValue );
	if ( ! range ) {
		return { kind: 'none' };
	}
	if ( overlapsExistingMarker( prev, next, range.start, range.end ) ) {
		return { kind: 'none' };
	}
	return { kind: 'format', range };
}

/**
 * Apply a format plan, producing the marked value: the prior run wrapped in a
 * `del` marker, followed by a copy of the reformatted run wrapped in an `add`
 * marker. Ids for the two markers are supplied by the caller (their created
 * note ids).
 *
 * @param {*}      prevValue          Value before the edit (source of the del run).
 * @param {*}      nextValue          Value after the edit (source of the reformatted run).
 * @param {Object} plan               Plan from `planFormatMarkers`.
 * @param {Object} options
 * @param {Object} options.ids        `{ delId, addId }` marker ids.
 * @param {number} [options.authorId] Author id stamped on both markers.
 * @return {*} New RichTextData with the paired markers, or `prevValue` unchanged.
 */
export function applyFormatPlan(
	prevValue,
	nextValue,
	plan,
	{ ids, authorId } = {}
) {
	if ( ! plan || plan.kind !== 'format' || ! ids ) {
		return prevValue;
	}
	const prev = toRecord( prevValue );
	const next = toRecord( nextValue );
	if ( ! prev || ! next ) {
		return prevValue;
	}
	const { start, end } = plan.range;

	// Wrap the original run in a `del` marker (text kept, struck through).
	const withDel = applyFormat(
		prev,
		{
			type: SUGGESTION_FORMAT_NAME,
			attributes: buildSuggestionMarkerAttributes( {
				id: ids.delId,
				type: SUGGESTION_TYPE_DELETION,
				authorId,
			} ),
		},
		start,
		end
	);

	// Take the reformatted run from `next` and wrap it in an `add` marker.
	const addRun = slice( next, start, end );
	const markedAddRun = applyFormat(
		addRun,
		{
			type: SUGGESTION_FORMAT_NAME,
			attributes: buildSuggestionMarkerAttributes( {
				id: ids.addId,
				type: SUGGESTION_TYPE_ADDITION,
				authorId,
			} ),
		},
		0,
		addRun.text.length
	);

	// Insert the marked `add` run immediately after the `del` run. The del wrap
	// doesn't change text length, so `end` is still the right insertion point.
	const combined = insert( withDel, markedAddRun, end, end );
	return new RichTextData( combined );
}
