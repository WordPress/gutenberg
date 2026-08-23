import { RichTextData, create, removeFormat } from '@wordpress/rich-text';
import { SUGGESTION_CLASS, SUGGESTION_FORMAT_NAME } from './format';

/**
 * Whether an attribute value carries a live inline suggestion marker.
 *
 * A containment probe on the serialized marker class, not a rich-text parse:
 * callers use it on every edit to decide whether the whole-content overlay
 * fallback would strip a marker that is still rendering, so it has to be cheap.
 * False positives are limited to values that mention the class in text, which
 * would only cost an edit its overlay capture.
 *
 * @param {*} value Attribute value (string, RichTextData, or anything else).
 * @return {boolean} True when the value contains a `core/suggestion` marker.
 */
export function hasSuggestionMarkers( value ) {
	if ( typeof value === 'string' ) {
		return value.includes( SUGGESTION_CLASS );
	}
	if ( value instanceof RichTextData ) {
		return value.toHTMLString().includes( SUGGESTION_CLASS );
	}
	return false;
}

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
	if ( ! html.includes( SUGGESTION_CLASS ) ) {
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
