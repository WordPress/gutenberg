/**
 * WordPress dependencies
 */
import { RichTextData, create, removeFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { SUGGESTION_FORMAT_NAME } from './format';

/**
 * The marker class the `core/suggestion` format serializes to. Used as a cheap
 * containment probe so unmarked values skip the rich-text parse entirely.
 */
const SUGGESTION_MARKER_CLASS = 'wp-suggestion';

/**
 * Strip inline `core/suggestion` markers from a single attribute value,
 * unwrapping the `<mark class="wp-suggestion">` format while keeping the text
 * and every other format (bold, links, and nested notes markers included).
 *
 * Why: values captured into the attribute overlay (baseline and proposed
 * `after` alike) must never carry OTHER suggestions' live markers. Accepting
 * an attribute suggestion later replays its `after` verbatim onto the block —
 * if that snapshot embedded a marker whose suggestion was accepted or
 * rejected in the interim, the stale marker would be resurrected with no
 * backing note. Stripping at capture time restores the invariant the retired
 * overlay renderer used to maintain via `stripMarksFromIncoming`.
 *
 * Pure and cheap on the common path: values that don't contain the marker
 * class are returned by reference without parsing.
 *
 * @param {*} value Attribute value (string, RichTextData, or anything else).
 * @return {*} The value with suggestion markers unwrapped; non-string-like
 * values (and marker-free values) are returned unchanged by reference.
 */
export function stripSuggestionMarkers( value ) {
	const isRich = value instanceof RichTextData;
	if ( ! isRich && typeof value !== 'string' ) {
		return value;
	}
	const html = isRich ? value.toHTMLString() : value;
	if ( ! html.includes( SUGGESTION_MARKER_CLASS ) ) {
		return value;
	}
	const record = create( { html } );
	const stripped = removeFormat(
		record,
		SUGGESTION_FORMAT_NAME,
		0,
		record.text.length
	);
	const result = new RichTextData( stripped );
	return isRich ? result : result.toHTMLString();
}

/**
 * Strip inline suggestion markers from every string-like value of an
 * attributes object. Returns the input by reference when nothing changed so
 * callers (and React) can rely on identity.
 *
 * @param {Object|null|undefined} attributes Attribute map.
 * @return {Object|null|undefined} Attributes with markers stripped.
 */
export function stripSuggestionMarkersFromAttributes( attributes ) {
	if ( ! attributes || typeof attributes !== 'object' ) {
		return attributes;
	}
	let changed = false;
	const next = {};
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		const stripped = stripSuggestionMarkers( value );
		next[ key ] = stripped;
		if ( stripped !== value ) {
			changed = true;
		}
	}
	return changed ? next : attributes;
}
