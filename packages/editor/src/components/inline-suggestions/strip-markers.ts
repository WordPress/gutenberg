import {
	RichTextData,
	create,
	remove,
	removeFormat,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_CLASS,
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_ATTRIBUTE,
} from './format';

/**
 * Whether an attribute value carries a live inline suggestion marker.
 *
 * Cheap by design: callers use it on every edit to decide whether the
 * whole-content overlay fallback would strip a marker that is still
 * rendering. `RichTextData` is scanned for the format without serializing; a
 * string gets a containment probe on the marker class, whose false positives
 * (text that mentions the class) only cost an edit its overlay capture.
 *
 * @param value Attribute value (string, RichTextData, or anything else).
 * @return True when the value contains a `core/suggestion` marker.
 */
export function hasSuggestionMarkers( value: any ): boolean {
	if ( typeof value === 'string' ) {
		return value.includes( SUGGESTION_CLASS );
	}
	if ( value instanceof RichTextData ) {
		// `RichTextData` types its `formats` as `never[]`.
		const formats: RichTextValue[ 'formats' ] = value.formats;
		return formats.some( ( stack ) =>
			stack?.some( ( format ) => format.type === SUGGESTION_FORMAT_NAME )
		);
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
 * @param value Attribute value (string, RichTextData, or anything else).
 * @return The value with suggestion markers unwrapped; non-string-like
 * values (and marker-free values) are returned unchanged by reference.
 */
export function stripSuggestionMarkers( value: any ): any {
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
	const result = new RichTextData( stripped as any );
	return isRich ? result : result.toHTMLString();
}

/**
 * Strip inline suggestion markers from every string-like value of an
 * attributes object. Returns the input by reference when nothing changed so
 * callers (and React) can rely on identity.
 *
 * @param attributes Attribute map.
 * @return Attributes with markers stripped.
 */
export function stripSuggestionMarkersFromAttributes(
	attributes: Record< string, any > | null | undefined
): any {
	if ( ! attributes || typeof attributes !== 'object' ) {
		return attributes;
	}
	let changed = false;
	const next: Record< string, any > = {};
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		const stripped = stripSuggestionMarkers( value );
		next[ key ] = stripped;
		if ( stripped !== value ) {
			changed = true;
		}
	}
	return changed ? next : attributes;
}

/**
 * Settle the inline suggestion markers in a value that is about to become part
 * of a pending block insertion, such as the tail of a split.
 *
 * Why: a block built from another block's content inherits its markers, and
 * with them their note ids, so one note ends up anchored in two blocks. A
 * pending insertion is already a proposal as a whole, so the markers inside it
 * have nothing left to say. They are resolved the way the front end renders
 * them (`gutenberg_strip_inline_suggestion_markers`): text proposed for
 * deletion is real text and stays; the author's own proposed text stays, now
 * proposed by the insertion; formatting proposed on a run stays on it; text
 * another author proposed is not this author's to adopt, so it is dropped.
 *
 * @param value    Attribute value (string, RichTextData, or anything else).
 * @param authorId Current author id. An unauthored marker counts as the
 *                 author's own only when the author is unknown too.
 * @return The settled value (same kind as the input, or the input by
 * reference when it carries no marker) and the ids of every marker removed.
 */
export function settleInsertedSuggestionMarkers(
	value: any,
	authorId?: number | string | null
): { value: any; ids: string[] } {
	const isRich = value instanceof RichTextData;
	if ( ! isRich && typeof value !== 'string' ) {
		return { value, ids: [] };
	}
	const html = isRich ? value.toHTMLString() : value;
	if ( ! html.includes( SUGGESTION_CLASS ) ) {
		return { value, ids: [] };
	}
	const authorToken =
		authorId !== undefined && authorId !== null ? String( authorId ) : '';
	let record: RichTextValue = create( { html } );
	const ids = new Set< string >();
	const isForeignAddition: boolean[] = [];
	record.formats.forEach( ( stack, index ) => {
		const marker = stack?.find(
			( format ) => format.type === SUGGESTION_FORMAT_NAME
		);
		const attributes: Record< string, string > =
			( marker?.attributes as Record< string, string > ) ?? {};
		if ( marker && attributes[ SUGGESTION_ID_ATTRIBUTE ] ) {
			ids.add( String( attributes[ SUGGESTION_ID_ATTRIBUTE ] ) );
		}
		isForeignAddition[ index ] =
			!! marker &&
			attributes[ SUGGESTION_TYPE_ATTRIBUTE ] ===
				SUGGESTION_TYPE_ADDITION &&
			String( attributes[ SUGGESTION_AUTHOR_ATTRIBUTE ] ?? '' ) !==
				authorToken;
	} );
	// Last run first, so earlier offsets stay valid as text is removed.
	for ( let end = record.text.length; end > 0; ) {
		if ( ! isForeignAddition[ end - 1 ] ) {
			end--;
			continue;
		}
		let start = end - 1;
		while ( start > 0 && isForeignAddition[ start - 1 ] ) {
			start--;
		}
		record = remove( record, start, end );
		end = start;
	}
	record = removeFormat(
		record,
		SUGGESTION_FORMAT_NAME,
		0,
		record.text.length
	);
	const result = new RichTextData( record as any );
	return {
		value: isRich ? result : result.toHTMLString(),
		ids: [ ...ids ],
	};
}
