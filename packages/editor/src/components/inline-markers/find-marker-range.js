/**
 * WordPress dependencies
 */
import { create, RichTextData } from '@wordpress/rich-text';

/**
 * Parse a block attribute value into a rich-text record, applying the cheap
 * `quickReject` substring check before the (relatively costly) parse. Shared
 * by `findMarkerRange` and `findMarkerText` so both resolve offsets the same
 * way from a single code path.
 *
 * @param {*}             value                 Block attribute value (RichTextData, string, or other).
 * @param {Object}        options
 * @param {number|string} options.id            Marker id (only its presence is checked here).
 * @param {string}        [options.quickReject] Optional substring used to skip parsing when absent.
 * @return {?Object} Rich-text record, or null when there is nothing to search.
 */
function parseMarkerValue( value, { id, quickReject } ) {
	if ( id === undefined || id === null ) {
		return null;
	}
	let html = null;
	if ( value instanceof RichTextData ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( ! html ) {
		return null;
	}
	// Cheap reject before the (relatively costly) rich-text parse.
	if ( quickReject && html.indexOf( quickReject ) === -1 ) {
		return null;
	}
	return create( { html } );
}

/**
 * Find the character range of the marker matching `id` within an already-parsed
 * rich-text record.
 *
 * @param {Object}        record      Rich-text record.
 * @param {string}        formatType  Rich-text format type to match.
 * @param {string}        idAttribute Marker attribute holding the id.
 * @param {number|string} id          Marker id to search for.
 * @return {?{start: number, end: number}} Range or null when no marker is found.
 */
function rangeInRecord( record, formatType, idAttribute, id ) {
	const target = String( id );
	const formats = record.formats;
	let start = -1;
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		const hit = stack?.find(
			( f ) =>
				f.type === formatType &&
				f.attributes &&
				f.attributes[ idAttribute ] === target
		);
		if ( hit ) {
			if ( start === -1 ) {
				start = i;
			}
		} else if ( start !== -1 ) {
			return { start, end: i };
		}
	}
	if ( start !== -1 ) {
		return { start, end: formats.length };
	}
	return null;
}

/**
 * Search a rich-text value for an inline marker (`<mark>` format) matching a
 * given id and return its character range.
 *
 * This is the single place inline-marker offsets are resolved: positions are
 * derived from the in-content marker on every read rather than stored, so a
 * marker survives unrelated edits elsewhere in the same attribute. It is the
 * intended swap point for a future CRDT-backed resolver.
 *
 * @param {*}             value                           Block attribute value (RichTextData, string, or other).
 * @param {Object}        options
 * @param {string}        options.formatType              Rich-text format type to match (e.g. `core/note`).
 * @param {string}        [options.idAttribute='data-id'] Marker attribute holding the id.
 * @param {number|string} options.id                      Marker id to search for.
 * @param {string}        [options.quickReject]           Optional substring (e.g. the marker class) used to
 *                                                        skip parsing when it is absent from the HTML.
 * @return {?{start: number, end: number}} Range or null when no marker is found.
 */
export function findMarkerRange(
	value,
	{ formatType, idAttribute = 'data-id', id, quickReject }
) {
	const record = parseMarkerValue( value, { id, quickReject } );
	if ( ! record ) {
		return null;
	}
	return rangeInRecord( record, formatType, idAttribute, id );
}

/**
 * Resolve the visible text wrapped by the marker matching `id`. Companion to
 * `findMarkerRange`: where that returns offsets, this returns the marked text
 * itself (e.g. for a sidebar summary of what a suggestion adds or removes).
 * Returns an empty string when the marker can no longer be found.
 *
 * @param {*}             value                           Block attribute value (RichTextData, string, or other).
 * @param {Object}        options
 * @param {string}        options.formatType              Rich-text format type to match.
 * @param {string}        [options.idAttribute='data-id'] Marker attribute holding the id.
 * @param {number|string} options.id                      Marker id to search for.
 * @param {string}        [options.quickReject]           Optional substring used to skip parsing when absent.
 * @return {string} The marked text, or '' when no marker is found.
 */
export function findMarkerText(
	value,
	{ formatType, idAttribute = 'data-id', id, quickReject }
) {
	const record = parseMarkerValue( value, { id, quickReject } );
	if ( ! record ) {
		return '';
	}
	const range = rangeInRecord( record, formatType, idAttribute, id );
	if ( ! range ) {
		return '';
	}
	return record.text.slice( range.start, range.end );
}
