/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	remove,
	removeFormat,
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
 * Accept a suggested deletion: drop both the marked text and its marker so the
 * proposed removal becomes permanent. The marker's range is resolved from the
 * in-content marker on read (never a stored offset), so it stays correct after
 * unrelated edits elsewhere in the value.
 *
 * Returns the value unchanged when it isn't rich text or the marker is absent.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marked text removed, or the original value.
 */
export function acceptInlineDeletion( value, suggestionId ) {
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
 * Reject a suggested deletion: keep the text and drop only the marker, so the
 * existing content is preserved and the suggestion goes away.
 *
 * Returns the value unchanged when it isn't rich text or the marker is absent.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function rejectInlineDeletion( value, suggestionId ) {
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
