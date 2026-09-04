import { create, RichTextData } from '@wordpress/rich-text';

/**
 * Parse a block attribute value into a rich-text record, applying the cheap
 * `quickReject` substring check before the (relatively costly) parse. Shared
 * by `findMarkerRange` and `findMarkerText` so both resolve offsets the same
 * way from a single code path.
 *
 * @param value               Block attribute value (RichTextData, string, or other).
 * @param options             Options.
 * @param options.id          Marker id (only its presence is checked here).
 * @param options.quickReject Optional substring used to skip parsing when absent.
 * @return Rich-text record, or null when there is nothing to search.
 */
function parseMarkerValue(
	value: any,
	{
		id,
		quickReject,
	}: { id: number | string | null | undefined; quickReject?: string }
) {
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
 * Whether a character's format stack carries the marker with the given id.
 *
 * @param stack       Formats applied to one character.
 * @param formatType  Rich-text format type to match.
 * @param idAttribute Marker attribute holding the id.
 * @param target      Marker id, as a string.
 * @return True when the stack holds the marker.
 */
function carriesId(
	stack: any[] | undefined,
	formatType: string,
	idAttribute: string,
	target: string
): boolean {
	return !! stack?.some(
		( f: any ) =>
			f.type === formatType &&
			f.attributes &&
			f.attributes[ idAttribute ] === target
	);
}

/**
 * Find the character range of the marker matching `id` within an already-parsed
 * rich-text record.
 *
 * The range spans from the first to the last character carrying the id, so a
 * marker that rich-text split into non-contiguous runs for the same id (an edit
 * inside the run, a nested-format grow, a serialization quirk) still resolves as
 * one range. Returning only the first contiguous run — as an earlier version did
 * — truncated accept/reject to a fragment of the marker. The gap between
 * fragments may hold unmarked text or another marker, so consumers that act on
 * characters rather than on the span (`findMarkerText`, `removeMarkedRange` in
 * inline-suggestions) test each character with `carriesId`.
 *
 * @param record      Rich-text record.
 * @param formatType  Rich-text format type to match.
 * @param idAttribute Marker attribute holding the id.
 * @param id          Marker id to search for.
 * @return Range or null when no marker is found.
 */
function rangeInRecord(
	record: any,
	formatType: string,
	idAttribute: string,
	id: number | string
): { start: number; end: number } | null {
	const target = String( id );
	const formats = record.formats;
	let start = -1;
	let end = -1;
	for ( let i = 0; i < formats.length; i++ ) {
		if ( carriesId( formats[ i ], formatType, idAttribute, target ) ) {
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
 * Search a rich-text value for an inline marker (`<mark>` format) matching a
 * given id and return its character range.
 *
 * This is the single place inline-marker offsets are resolved: positions are
 * derived from the in-content marker on every read rather than stored, so a
 * marker survives unrelated edits elsewhere in the same attribute. It is the
 * intended swap point for a future CRDT-backed resolver.
 *
 * @param value               Block attribute value (RichTextData, string, or other).
 * @param options             Options.
 * @param options.formatType  Rich-text format type to match (e.g. `core/note`).
 * @param options.idAttribute Marker attribute holding the id.
 * @param options.id          Marker id to search for.
 * @param options.quickReject Optional substring (e.g. the marker class) used to
 *                            skip parsing when it is absent from the HTML.
 * @return Range or null when no marker is found.
 */
export function findMarkerRange(
	value: any,
	{
		formatType,
		idAttribute = 'data-id',
		id,
		quickReject,
	}: {
		formatType: string;
		idAttribute?: string;
		id: number | string | null | undefined;
		quickReject?: string;
	}
) {
	const record = parseMarkerValue( value, { id, quickReject } );
	if ( ! record ) {
		return null;
	}
	return rangeInRecord( record, formatType, idAttribute, id! );
}

/**
 * Resolve the visible text wrapped by the marker matching `id`. Companion to
 * `findMarkerRange`: where that returns offsets, this returns the marked text
 * itself (e.g. for a sidebar summary of what a suggestion adds or removes).
 * Returns an empty string when the marker can no longer be found.
 *
 * @param value               Block attribute value (RichTextData, string, or other).
 * @param options             Options.
 * @param options.formatType  Rich-text format type to match.
 * @param options.idAttribute Marker attribute holding the id.
 * @param options.id          Marker id to search for.
 * @param options.quickReject Optional substring used to skip parsing when absent.
 * @return The marked text, or '' when no marker is found.
 */
export function findMarkerText(
	value: any,
	{
		formatType,
		idAttribute = 'data-id',
		id,
		quickReject,
	}: {
		formatType: string;
		idAttribute?: string;
		id: number | string | null | undefined;
		quickReject?: string;
	}
): string {
	const record = parseMarkerValue( value, { id, quickReject } );
	if ( ! record ) {
		return '';
	}
	const range = rangeInRecord( record, formatType, idAttribute, id! );
	if ( ! range ) {
		return '';
	}
	// A fragmented marker's span can hold unmarked text or another marker's
	// text; quote only the characters this marker owns, as accept and reject
	// act on those.
	const target = String( id );
	let text = '';
	for ( let i = range.start; i < range.end; i++ ) {
		if (
			carriesId( record.formats[ i ], formatType, idAttribute, target )
		) {
			text += record.text[ i ];
		}
	}
	return text;
}
