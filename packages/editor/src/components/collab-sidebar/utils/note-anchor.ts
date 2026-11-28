import { RichTextData } from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from '../constants';
import {
	applyNoteFormat,
	findNoteRange,
	removeNoteFormat,
} from './note-format';
import { toAttribute, toNoteRecord, toRecord } from './rich-text';
import type {
	BlockAttributes,
	BlockSelection,
	NoteAnchor,
	NoteId,
} from './types';

// Sentinel that sorts a block-level (whole-block) note before any inline note
// within the same block. Negative so any real character offset (>= 0) ranks
// after it. Number.NEGATIVE_INFINITY would work too; -1 is enough and keeps
// the diff arithmetic in safe integers.
export const BLOCK_LEVEL_NOTE_START = -1;

/**
 * Locate a note's in-content `core/note` marker across all of a block's
 * attributes. The marker (carrying `data-id`) is the single source of truth for
 * an inline note's anchor: a note is inline iff a marker with its id exists in
 * the block, and the attribute that holds it is discovered here rather than
 * stored separately. Returns the matching attribute key and the marker range.
 *
 * @param attributes Block attributes, or null/undefined when unloaded.
 * @param noteId     Note id to search for.
 * @return Anchor or null when no marker is found.
 */
export function findNoteInBlock(
	attributes: BlockAttributes | null | undefined,
	noteId: NoteId | null | undefined
): NoteAnchor | null {
	if ( ! attributes || noteId === undefined || noteId === null ) {
		return null;
	}
	for ( const attributeKey of Object.keys( attributes ) ) {
		const record = toNoteRecord( attributes[ attributeKey ] );
		const range = record && findNoteRange( record, noteId );
		if ( range ) {
			return { attributeKey, start: range.start, end: range.end };
		}
	}
	return null;
}

/**
 * Blocks that hold a note at block level: those without its marker while
 * none of the blocks has one, else only those without a text field for one.
 * A split can leave a text block with the note's id but none of its text,
 * which shouldn't turn an inline note into a block-level one, but an image
 * between the text a note spans is part of it.
 *
 * @param noteId             Note id.
 * @param clientIds          The note's blocks.
 * @param getBlockAttributes Block-editor selector.
 * @param isTextBlock        Whether the block's only content is one rich text field, see `getSoleRichTextAttributeKey`.
 * @return Client IDs of the blocks that hold the note at block level.
 */
export function getBlockLevelClientIds(
	noteId: NoteId,
	clientIds: string[],
	getBlockAttributes: ( clientId: string ) => BlockAttributes | null,
	isTextBlock: ( clientId: string ) => boolean
): string[] {
	const withoutMarker = clientIds.filter(
		( clientId ) =>
			! findNoteInBlock( getBlockAttributes( clientId ), noteId )
	);
	return withoutMarker.length === clientIds.length
		? withoutMarker
		: withoutMarker.filter( ( clientId ) => ! isTextBlock( clientId ) );
}

/**
 * Resolve an inline note's character offset in its block so threads can be
 * sorted by reading order. A note is inline iff an in-content `core/note`
 * marker carries its id; block-level notes (no marker) sort first within their
 * block via a sentinel.
 *
 * @param thread     Materialized thread record (with `.id`).
 * @param attributes Block attributes for the thread's block.
 * @return Marker start offset, or `BLOCK_LEVEL_NOTE_START` when there is no inline anchor.
 */
export function getInlineMarkerStart(
	thread: { id?: NoteId } | null | undefined,
	attributes: BlockAttributes | null | undefined
): number {
	const found = findNoteInBlock( attributes, thread?.id );
	return found ? found.start : BLOCK_LEVEL_NOTE_START;
}

/**
 * Text a new note wraps in each selected block, as a format applied across
 * blocks does: the first block from the caret, the blocks between in full,
 * the last block up to the caret. Only for a selection with text in it.
 *
 * @param props
 * @param props.blocks         Selected blocks in order, each with its attributes and sole rich text attribute, see `getSoleRichTextAttributeKey`.
 * @param props.selectionStart Block-editor selection start.
 * @param props.selectionEnd   Block-editor selection end.
 * @return Range by client ID for the blocks that have one; empty for a block the selection gives no text.
 */
export function getNoteRanges( {
	blocks,
	selectionStart,
	selectionEnd,
}: {
	blocks: Array< {
		clientId: string;
		attributes: BlockAttributes | null | undefined;
		attributeKey?: string | null;
	} >;
	selectionStart: Required< BlockSelection >;
	selectionEnd: Required< BlockSelection >;
} ): Map< string, NoteAnchor > {
	const clientIds = blocks.map( ( block ) => block.clientId );
	// Reassign selection start and end based on order, as the block editor does.
	const isBackward =
		selectionStart.clientId === selectionEnd.clientId
			? selectionStart.offset > selectionEnd.offset
			: clientIds.indexOf( selectionStart.clientId ) >
				clientIds.indexOf( selectionEnd.clientId );
	const [ first, last ] = isBackward
		? [ selectionEnd, selectionStart ]
		: [ selectionStart, selectionEnd ];

	const ranges = new Map< string, NoteAnchor >();
	for ( const block of blocks ) {
		const isFirst = block.clientId === first.clientId;
		const isLast = block.clientId === last.clientId;
		// The selection's ends say which field they are in; the blocks between
		// take their only one.
		let attributeKey = block.attributeKey;
		if ( isFirst ) {
			attributeKey = first.attributeKey;
		} else if ( isLast ) {
			attributeKey = last.attributeKey;
		}
		if ( attributeKey ) {
			ranges.set( block.clientId, {
				attributeKey,
				start: isFirst ? first.offset : 0,
				end: isLast
					? last.offset
					: toRecord( block.attributes?.[ attributeKey ] ).text
							.length,
			} );
		}
	}
	return ranges;
}

/**
 * Wrap a rich-text range with a core/note marker. Returns a new value ready to
 * write back into block attributes, or null when the incoming value isn't a
 * rich-text instance (legacy/string attributes).
 *
 * @param value Existing block attribute value.
 * @param id    New note id to embed as `data-id`.
 * @param start Range start offset.
 * @param end   Range end offset.
 * @return Wrapped value or null when the attribute isn't rich text.
 */
export function wrapInlineNote(
	value: unknown,
	id: NoteId,
	start: number,
	end: number
): string | RichTextData | null {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const record = applyNoteFormat(
		toRecord( value ),
		{ type: NOTE_FORMAT_NAME, attributes: { 'data-id': String( id ) } },
		start,
		end
	);
	return toAttribute( record, value );
}

/**
 * Remove a note's inline `core/note` marker from block attributes.
 *
 * @param attributes Block attributes.
 * @param noteId     Note id whose marker to remove.
 * @return Marker range, the text it wrapped and the new attribute value, or
 *         null when no marker.
 */
export function removeInlineNote(
	attributes: BlockAttributes | null | undefined,
	noteId: NoteId
): ( NoteAnchor & { text: string; value: string | RichTextData } ) | null {
	const found = findNoteInBlock( attributes, noteId );
	const current = found && attributes?.[ found.attributeKey ];
	if ( ! found || ! ( current instanceof RichTextData ) ) {
		return null;
	}
	const record = removeNoteFormat( toRecord( current ), noteId );
	return {
		...found,
		text: record.text.slice( found.start, found.end ),
		value: toAttribute( record, current ),
	};
}
