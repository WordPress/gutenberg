/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	insert,
	remove,
	removeFormat,
	applyFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
	findSuggestionRange,
} from './format';

/**
 * Build the attribute map for a `core/suggestion` marker. Pins the marker
 * contract in one place: the id links to the persisted suggestion (its comment
 * id), the type is `del` or `add`, and the author tags the marker so per-author
 * attribution survives reload and reviewer view. The author attribute is
 * omitted when no author id is known.
 *
 * @param {Object}        options
 * @param {number|string} options.id         Suggestion (comment) id.
 * @param {'del'|'add'}   options.type       Marker kind.
 * @param {number|string} [options.authorId] Author user id.
 * @return {Object} Marker attributes for `wrapInlineMarker`.
 */
export function buildSuggestionMarkerAttributes( { id, type, authorId } ) {
	return {
		[ SUGGESTION_ID_ATTRIBUTE ]: String( id ),
		[ SUGGESTION_TYPE_ATTRIBUTE ]: type,
		...( authorId !== undefined && authorId !== null
			? { [ SUGGESTION_AUTHOR_ATTRIBUTE ]: String( authorId ) }
			: {} ),
	};
}

/**
 * Remove a suggestion marker's text *and* its marker, by id. The proposed-for-
 * removal text disappears (accepting a deletion) or the proposed-new text is
 * discarded (rejecting an addition) — the two ends of a suggestion that resolve
 * to "the marked run goes away". The range is resolved from the in-content
 * marker on read (never a stored offset), so it stays correct after unrelated
 * edits elsewhere in the value.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id.
 * @return {*} New RichTextData with the marked run removed, or the original value.
 */
function removeMarkedRange( value, suggestionId ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	return new RichTextData( remove( record, range.start, range.end ) );
}

/**
 * Drop only a suggestion marker, keeping the text it wrapped, by id. The
 * existing text stays (rejecting a deletion) or the proposed-new text becomes
 * permanent (accepting an addition) — the two ends of a suggestion that resolve
 * to "the marked run stays, the marker goes".
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
function unwrapMarker( value, suggestionId ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	return new RichTextData(
		removeFormat( record, SUGGESTION_FORMAT_NAME, range.start, range.end )
	);
}

/**
 * Accept a suggested deletion: drop both the marked text and its marker so the
 * proposed removal becomes permanent.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marked text removed, or the original value.
 */
export function acceptInlineDeletion( value, suggestionId ) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Reject a suggested deletion: keep the text and drop only the marker, so the
 * existing content is preserved and the suggestion goes away.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function rejectInlineDeletion( value, suggestionId ) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Accept a suggested addition: keep the proposed text and drop only the marker,
 * so the new content becomes permanent. (Mirror of rejecting a deletion.)
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function acceptInlineAddition( value, suggestionId ) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Reject a suggested addition: drop both the proposed text and its marker, so
 * the content returns to its pre-suggestion state. (Mirror of accepting a
 * deletion.)
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @return {*} New RichTextData with the marked text removed, or the original value.
 */
export function rejectInlineAddition( value, suggestionId ) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Insert proposed new text wrapped in an `add` suggestion marker, replacing the
 * given range (a collapsed range is a plain caret insertion; a non-collapsed
 * range is a type-over). The inserted run carries the marker attributes so it
 * reads as a pending addition and resolves later via `acceptInlineAddition` /
 * `rejectInlineAddition`.
 *
 * Pure and id-agnostic: the caller supplies the marker attributes (including the
 * comment id once the suggestion is persisted), so this can be unit-tested and
 * reused by whatever drives addition creation.
 *
 * @param {*}      value              Block attribute value (RichTextData or other).
 * @param {Object} options
 * @param {string} options.text       Proposed text to insert.
 * @param {Object} options.attributes Marker attributes (see `buildSuggestionMarkerAttributes`).
 * @param {number} [options.start]    Range start; defaults to end of value.
 * @param {number} [options.end]      Range end; defaults to `start` (collapsed).
 * @return {*} New RichTextData with the marked addition inserted, or the original value.
 */
export function insertInlineAddition(
	value,
	{ text, attributes, start, end }
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	if ( ! text ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	const startIndex = start ?? record.text.length;
	const endIndex = end ?? startIndex;
	const inserted = insert( record, text, startIndex, endIndex );
	const formatted = applyFormat(
		inserted,
		{ type: SUGGESTION_FORMAT_NAME, attributes },
		startIndex,
		startIndex + text.length
	);
	return new RichTextData( formatted );
}
