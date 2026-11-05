import { create, RichTextData } from '@wordpress/rich-text';
import type { RichTextFormat, RichTextValue } from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from '../constants';
import type { NoteId, NoteRange } from './types';

/**
 * Search a rich-text value for a `core/note` marker matching `noteId` and
 * return its character range. Used to derive an inline note's anchor from
 * the in-content marker (resilient to edits) rather than stale offset meta.
 *
 * @param value  Block attribute value (RichTextData, string, or other).
 * @param noteId Note id to search for.
 * @return Range or null when no marker is found.
 */
export function findNoteRange(
	value: unknown,
	noteId: NoteId | null | undefined
): NoteRange | null {
	if ( noteId === undefined || noteId === null ) {
		return null;
	}
	let formats;
	if ( value instanceof RichTextData ) {
		formats = value.formats;
	} else if ( typeof value === 'string' && value.includes( 'wp-note' ) ) {
		formats = create( { html: value } ).formats;
	} else {
		return null;
	}
	const target = String( noteId );
	let start = -1;
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		const hit = stack?.find(
			( f ) =>
				f.type === NOTE_FORMAT_NAME &&
				f.attributes &&
				f.attributes[ 'data-id' ] === target
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
 * Apply a `core/note` marker across `[start, end)` without removing notes
 * already present in that range.
 *
 * Rich-text's `applyFormat` strips any existing format of the same type before
 * applying, so two `core/note` markers can't coexist - a note drawn over an
 * existing one would wipe it in the overlap. This keeps every overlapping note
 * and orders the markers outermost-first by span, so a note fully contained in
 * another nests inside it (`<mark><mark>…</mark></mark>`). Crossing (partial)
 * overlaps can't nest in HTML and serialize as split runs, but each note keeps
 * its full range.
 *
 * @param record A rich-text record (`{ text, formats, … }`).
 * @param format The `core/note` format to add (`{ type, attributes }`).
 * @param start  Range start (inclusive).
 * @param end    Range end (exclusive).
 * @return A new record with the note applied.
 */
export function applyNoteFormat(
	record: RichTextValue,
	format: RichTextFormat,
	start: number,
	end: number
): RichTextValue {
	const formats = record.formats.slice();
	for ( let i = start; i < end; i++ ) {
		const stack = formats[ i ] ? formats[ i ].slice() : [];
		stack.push( format );
		formats[ i ] = stack;
	}

	// Measure each note's full span so containment can order the markers.
	const spans = new Map< string | undefined, NoteRange >();
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		if ( ! stack ) {
			continue;
		}
		for ( const fmt of stack ) {
			if ( fmt.type !== NOTE_FORMAT_NAME ) {
				continue;
			}
			const id = fmt.attributes?.[ 'data-id' ];
			const span = spans.get( id );
			if ( span ) {
				span.end = i;
			} else {
				spans.set( id, { start: i, end: i } );
			}
		}
	}
	const sizeOf = ( id: string | undefined ) => {
		const span = spans.get( id );
		return span ? span.end - span.start : 0;
	};

	// Order markers outermost-first (widest span) so `toTree` nests them rather
	// than splitting an outer note around an inner one. Notes sort ahead of
	// other formats so a note wraps the formatted text it spans.
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ];
		if ( ! stack || stack.length < 2 ) {
			continue;
		}
		const notes = stack.filter( ( fmt ) => fmt.type === NOTE_FORMAT_NAME );
		if ( notes.length === 0 ) {
			continue;
		}
		if ( notes.length > 1 ) {
			notes.sort(
				( a, b ) =>
					sizeOf( b.attributes?.[ 'data-id' ] ) -
					sizeOf( a.attributes?.[ 'data-id' ] )
			);
		}
		const others = stack.filter( ( fmt ) => fmt.type !== NOTE_FORMAT_NAME );
		formats[ i ] = [ ...notes, ...others ];
	}

	return { ...record, formats };
}

/**
 * Remove a single note's `core/note` marker from a rich-text value, leaving any
 * other notes nested or overlapping with it intact. Used when a note is deleted
 * or resolved so its highlight does not linger in the content.
 *
 * Rich-text's `removeFormat` strips every `core/note` marker in a range, so it
 * would wipe co-located notes; this filters by `data-id` to drop only the target
 * marker.
 *
 * @param value  Block attribute value (RichTextData or other).
 * @param noteId Note id whose marker should be removed.
 * @return A new value with the marker removed, or null when the attribute
 *         isn't rich text or carries no such marker.
 */
export function removeNoteFormat(
	value: unknown,
	noteId: NoteId
): RichTextData | null {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const target = String( noteId );
	const record = create( { html: value } );
	let changed = false;
	const formats = record.formats.slice();
	formats.forEach( ( stack, index ) => {
		const filtered = stack.filter(
			( format ) =>
				! (
					format.type === NOTE_FORMAT_NAME &&
					format.attributes?.[ 'data-id' ] === target
				)
		);
		if ( filtered.length === stack.length ) {
			return;
		}
		changed = true;
		if ( filtered.length ) {
			formats[ index ] = filtered;
		} else {
			// Rich-text expects holes, not `undefined`, at unformatted indices.
			delete formats[ index ];
		}
	} );
	return changed ? new RichTextData( { ...record, formats } ) : null;
}

let lastParsed: {
	html: string | null;
	formats: RichTextValue[ 'formats' ] | null;
} = { html: null, formats: null };

/**
 * Formats of a rich-text attribute. A string is parsed only when it holds a
 * marker, and the last parse is cached: caret moves re-read the same string.
 *
 * @param value Block attribute value.
 * @return Formats array, or null when the value isn't rich text.
 */
export function getFormats(
	value: unknown
): RichTextValue[ 'formats' ] | null {
	if ( value instanceof RichTextData ) {
		return value.formats;
	}
	if ( typeof value !== 'string' || ! value.includes( 'wp-note' ) ) {
		return null;
	}
	if ( lastParsed.html !== value ) {
		lastParsed = {
			html: value,
			formats: create( { html: value } ).formats,
		};
	}
	return lastParsed.formats;
}

/**
 * Note id carried by a marker's `data-id`.
 *
 * @param id Marker `data-id`.
 * @return Note id, or `'new'` for the draft marker.
 */
export function toNoteId( id: string | undefined ): NoteId {
	return id === 'new' ? id : Number( id );
}
