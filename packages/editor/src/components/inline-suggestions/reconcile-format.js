/**
 * Phase 2 of the overlay-retirement work (#73411): inline formatting -> marks.
 *
 * A format-only edit (bold/italic/link toggled over a run, the text itself
 * unchanged) is modelled as a single `format` marker wrapping the run — the
 * Google Docs model: the text is shown once, in place, carrying the *proposed*
 * formatting, never duplicated. The original run is captured separately so a
 * reject can restore it (the caller persists it on the suggestion note).
 * Accepting unwraps the marker (proposed formatting stays); rejecting replaces
 * the run with the captured original.
 *
 * This module is the pure engine only: it detects the format delta and plans /
 * applies the marker against rich-text values. It does not touch the store or
 * create notes — the caller wires those, exactly as `reconcile-edit.js` is
 * wired for text edits. `analyzeTextEdit` sees no text change for a format-only
 * edit, so format detection needs this separate pass.
 */
/**
 * WordPress dependencies
 */
import { RichTextData, create, slice, applyFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { SUGGESTION_FORMAT_NAME, SUGGESTION_TYPE_FORMAT } from './format';
import { buildSuggestionMarkerAttributes } from './operations';

/**
 * Serialize a rich-text record range to an HTML string, for capturing the
 * original run so a reject can restore it.
 *
 * @param {Object} record Rich-text record.
 * @param {number} start  Range start.
 * @param {number} end    Range end.
 * @return {string} HTML of the sliced run.
 */
function sliceToHTML( record, start, end ) {
	return new RichTextData( slice( record, start, end ) ).toHTMLString();
}

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

/*
 * Per-stack-array memo for `stackKey`. Rich-text shares one formats-array
 * reference across every character of a contiguous formatted run, so caching
 * by reference collapses the per-character key computation to once per run.
 * A WeakMap so retired records don't pin their stacks in memory.
 */
const stackKeyCache = new WeakMap();

/**
 * Comparison key for a character's whole format stack, excluding the suggestion
 * marker itself (so a value that already carries markers isn't seen as
 * "different" only because of them, and re-running is stable). Sorted so stack
 * order doesn't matter. Memoized per stack-array reference.
 *
 * @param {Array} stack Per-character format stack (may be undefined).
 * @return {string} Comparison key for the stack.
 */
function stackKey( stack ) {
	if ( ! Array.isArray( stack ) ) {
		return '';
	}
	const cached = stackKeyCache.get( stack );
	if ( cached !== undefined ) {
		return cached;
	}
	const key = stack
		.filter( ( f ) => f.type !== SUGGESTION_FORMAT_NAME )
		.map( formatKey )
		.sort()
		.join( '|' );
	stackKeyCache.set( stack, key );
	return key;
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
 * Plan the marker for a format-only edit. One `format` marker wraps the run; the
 * plan also carries the original and proposed run HTML so the caller can persist
 * the original on the note (for reject) and summarize the change.
 *
 * @param {*} prevValue Value before the edit.
 * @param {*} nextValue Value after the edit.
 * @return {{ kind: 'format'|'none', range?: {start:number, end:number},
 *           beforeHTML?: string, afterHTML?: string }} Plan.
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
	return {
		kind: 'format',
		range,
		beforeHTML: sliceToHTML( prev, range.start, range.end ),
		afterHTML: sliceToHTML( next, range.start, range.end ),
	};
}

/**
 * Apply a format plan, producing the marked value: the reformatted run (from the
 * next value, carrying the proposed formatting) wrapped in a single `format`
 * marker. The marker id is the caller's created note id. The text is unchanged,
 * so no duplication — the run is shown once with the proposed formatting.
 *
 * @param {*}             nextValue          Value after the edit (source of the reformatted run).
 * @param {Object}        plan               Plan from `planFormatMarkers`.
 * @param {Object}        options
 * @param {number|string} options.id         Marker (note) id.
 * @param {number}        [options.authorId] Author id stamped on the marker.
 * @return {*} New RichTextData with the format marker, or `nextValue` unchanged.
 */
export function applyFormatPlan( nextValue, plan, { id, authorId } = {} ) {
	if ( ! plan || plan.kind !== 'format' || id === undefined || id === null ) {
		return nextValue;
	}
	const next = toRecord( nextValue );
	if ( ! next ) {
		return nextValue;
	}
	const { start, end } = plan.range;

	const marked = applyFormat(
		next,
		{
			type: SUGGESTION_FORMAT_NAME,
			attributes: buildSuggestionMarkerAttributes( {
				id,
				type: SUGGESTION_TYPE_FORMAT,
				authorId,
			} ),
		},
		start,
		end
	);
	return new RichTextData( marked );
}
