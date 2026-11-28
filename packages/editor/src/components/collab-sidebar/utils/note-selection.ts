import { getActiveFormat } from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from '../constants';
import { toNoteId } from './note-format';
import { toNoteRecord } from './rich-text';
import type {
	BlockAttributes,
	BlockSelection,
	NoteId,
	NoteThread,
} from './types';

/**
 * Note whose marker covers the whole selection. A caret on a marker's edge is
 * outside, as for any inline format.
 *
 * @param attributes     Block attributes.
 * @param selectionStart Block-editor selection start.
 * @param selectionEnd   Block-editor selection end.
 * @return Note id, `'new'` for the draft marker, undefined outside markers, or
 *         null when the caret is unknown.
 */
export function getNoteAtCaret(
	attributes: BlockAttributes | null | undefined,
	selectionStart: BlockSelection | undefined,
	selectionEnd: BlockSelection | undefined
): NoteId | undefined | null {
	const attributeKey = selectionStart?.attributeKey;
	const start = selectionStart?.offset;
	const end = selectionEnd?.offset;
	if (
		! attributeKey ||
		start === undefined ||
		end === undefined ||
		selectionEnd?.clientId !== selectionStart?.clientId ||
		selectionEnd?.attributeKey !== attributeKey
	) {
		return null;
	}
	const record = toNoteRecord( attributes?.[ attributeKey ] );
	if ( ! record ) {
		return undefined;
	}
	const value = {
		text: record.text,
		formats: record.formats,
		replacements: record.replacements,
		start: Math.min( start, end ),
		end: Math.max( start, end ),
	};
	const id = getActiveFormat( value, NOTE_FORMAT_NAME )?.attributes?.[
		'data-id'
	];
	return id ? toNoteId( id ) : undefined;
}

const isSamePoint = ( a: BlockSelection, b: BlockSelection ) =>
	a.clientId === b.clientId &&
	a.attributeKey === b.attributeKey &&
	a.offset === b.offset;

export interface CaretSnapshot {
	/**
	 * Selected blocks.
	 */
	clientIds: string[];
	/**
	 * Block attributes while one block is selected, else undefined.
	 */
	attributes: BlockAttributes | null | undefined;
	selectionStart: BlockSelection;
	selectionEnd: BlockSelection;
}

/**
 * Whether a store change is a caret move. Skips typing: a selection change
 * batched with a content change moves the caret with the text, never across
 * a marker.
 *
 * @param previous Snapshot before the store change.
 * @param next     Snapshot after it.
 * @return The caret move, or null when there is none.
 */
export function getCaretChange(
	previous: CaretSnapshot,
	next: CaretSnapshot
): { isBlockChange: boolean } | null {
	if (
		next.selectionStart === previous.selectionStart &&
		next.selectionEnd === previous.selectionEnd
	) {
		return null;
	}
	// A selection across blocks is one anchor, so moving either of its ends
	// moves to another, as entering another block does. The store can replace
	// the ends without moving them.
	const isSameSelection =
		isSamePoint( next.selectionStart, previous.selectionStart ) &&
		isSamePoint( next.selectionEnd, previous.selectionEnd );
	const isBlockChange =
		( next.clientIds.length > 1 && ! isSameSelection ) ||
		next.clientIds.length !== previous.clientIds.length ||
		next.clientIds.some(
			( clientId, index ) => clientId !== previous.clientIds[ index ]
		);
	if ( ! isBlockChange && next.attributes !== previous.attributes ) {
		return null;
	}
	return { isBlockChange };
}

/**
 * Ids of the notes with a marker in the block, the draft marker's `'new'`
 * included.
 *
 * @param attributes Block attributes.
 * @return Note ids.
 */
function getInlineNoteIds(
	attributes: BlockAttributes | null | undefined
): Set< NoteId > {
	const ids = new Set< NoteId >();
	for ( const value of Object.values( attributes ?? {} ) ) {
		toNoteRecord( value )?.formats.forEach( ( stack ) => {
			for ( const format of stack ?? [] ) {
				if ( format.type === NOTE_FORMAT_NAME ) {
					ids.add( toNoteId( format.attributes?.[ 'data-id' ] ) );
				}
			}
		} );
	}
	return ids;
}

interface BlockNoteProps {
	/**
	 * Block attributes.
	 */
	attributes: BlockAttributes | null | undefined;
	/**
	 * The block's threads.
	 */
	blockThreads: NoteThread[];
	/**
	 * Whether the block has an unsent note draft.
	 */
	hasDraft: boolean;
	/**
	 * Currently selected note.
	 */
	selectedNoteId: NoteId | undefined;
}

/**
 * Note for a caret in the block but outside markers: the unsent draft, else a
 * block-level note (the selected one, else the primary), else none.
 *
 * @param props
 * @param props.attributes
 * @param props.blockThreads
 * @param props.hasDraft
 * @param props.selectedNoteId
 * @return Note id, `'new'` for the draft form, or undefined.
 */
function getBlockNote( {
	attributes,
	blockThreads,
	hasDraft,
	selectedNoteId,
}: BlockNoteProps ): NoteId | undefined {
	if ( hasDraft ) {
		return 'new';
	}
	const inlineNoteIds = getInlineNoteIds( attributes );
	const blockLevelThreads = blockThreads.filter(
		( thread ) => ! inlineNoteIds.has( thread.id )
	);
	return (
		blockLevelThreads.find( ( thread ) => thread.id === selectedNoteId ) ??
		pickPrimaryNote( blockLevelThreads )
	)?.id;
}

/**
 * Selected note after a caret move; see "Note selection" in the README.
 *
 * | Caret event                       | Selected note becomes       |
 * | --------------------------------- | --------------------------- |
 * | Enters a marker                   | that note                   |
 * | Enters another block              | the block's, `getBlockNote` |
 * | Leaves the selected note's marker | the block's, `getBlockNote` |
 * | Anything else                     | unchanged                   |
 *
 * @param props
 * @param props.noteAtCaret    See `getNoteAtCaret`.
 * @param props.isBlockChange  Whether the caret came from another block.
 * @param props.attributes
 * @param props.blockThreads
 * @param props.hasDraft
 * @param props.selectedNoteId
 * @return Note id, `'new'` for the draft form, or undefined.
 */
export function pickNoteForCaret( {
	noteAtCaret,
	isBlockChange,
	attributes,
	blockThreads,
	hasDraft,
	selectedNoteId,
}: BlockNoteProps & {
	noteAtCaret: NoteId | undefined | null;
	isBlockChange: boolean;
} ): NoteId | undefined {
	// Enters a marker.
	if ( noteAtCaret ) {
		return noteAtCaret;
	}
	// Enters another block, or leaves the selected note's marker.
	if (
		isBlockChange ||
		( noteAtCaret === undefined &&
			selectedNoteId !== undefined &&
			getInlineNoteIds( attributes ).has( selectedNoteId ) )
	) {
		return getBlockNote( {
			attributes,
			blockThreads,
			hasDraft,
			selectedNoteId,
		} );
	}
	// Anything else: moving in plain text, a caret not reported yet.
	return selectedNoteId;
}

/**
 * Whether one block is selected and has unsent note text. Only such a draft
 * keeps its marker when its form is left and comes back with the block; a
 * draft across blocks comes back on its first block, without the others.
 *
 * @param drafts    Unsent note drafts, keyed by block client ID.
 * @param clientIds Selected blocks.
 * @return Whether the blocks have a draft.
 */
export function hasBlockDraft(
	drafts: Map< string, unknown >,
	clientIds: string[]
): boolean {
	return clientIds.length === 1 && drafts.has( clientIds[ 0 ] );
}

/**
 * Picks the most relevant thread from a list: first unresolved, else first.
 *
 * @param threads Ordered list of thread objects.
 * @return Selected thread or null when the list is empty.
 */
export function pickPrimaryNote< T extends NoteThread >(
	threads: T[]
): T | null {
	return (
		threads.find( ( thread ) => thread.status === 'hold' ) ??
		threads[ 0 ] ??
		null
	);
}
