import { _x } from '@wordpress/i18n';
import { create, RichTextData, toHTMLString } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { getRectangleFromRange } from '@wordpress/dom';

/**
 * Block attributes, keyed by attribute name.
 */
export type BlockAttributes = Record< string, any >;

/**
 * A note comment record, as returned by the comments REST endpoint and
 * materialized by `useNoteThreads` (replies and block anchors attached).
 * The pending new-note placeholder uses the `'new'` id.
 */
export interface Thread {
	id: number | 'new';
	parent?: number;
	status?: string;
	content?: { rendered?: string; raw?: string };
	author?: number;
	author_name?: string;
	blockClientId?: string | null;
	blockClientIds?: string[];
	reply?: Thread[];
	[ key: string ]: any;
}

/**
 * A block-editor selection endpoint, as returned by `getSelectionStart` /
 * `getSelectionEnd`.
 */
export interface NoteSelectionPoint {
	clientId?: string;
	attributeKey?: string;
	offset?: number;
}

/**
 * One block's share of a note anchor: the attribute and character range a
 * `core/note` marker should cover, or a block-level anchor when
 * `attributeKey` is null.
 */
export interface NoteSegment {
	clientId: string;
	attributeKey: string | null;
	start: number | null;
	end: number | null;
}

/**
 * The block-editor selectors `readMultiBlockSelection` reads.
 */
export interface MultiBlockSelectionSelectors {
	getSelectionStart: () => NoteSelectionPoint | undefined;
	getSelectionEnd: () => NoteSelectionPoint | undefined;
	getSelectedBlockClientIds: () => string[];
	getBlockAttributes: (
		clientId: string
	) => BlockAttributes | null | undefined;
}

/**
 * A rich-text format entry for a `core/note` marker. The rich-text package
 * doesn't export its format type, and its declared shape omits the
 * `attributes` bag the runtime carries.
 */
export type NoteMarkerFormat = {
	type: string;
	attributes?: Record< string, string >;
};

/**
 * Sanitizes a note string by trimming leading and trailing whitespace.
 *
 * @param str The note string to sanitize.
 * @return The sanitized note string.
 */
export function sanitizeNoteContent( str: string ): string {
	return str.trim();
}

const THREAD_ALIGN_OFFSET = -16;
const THREAD_GAP = 16;
const OVERLAP_MARGIN = 20;

/**
 * Avatar border colors chosen to be visually distinct from each other and from
 * the editor's semantic UI colors (Delta E > 10 between all pairs).
 */
const AVATAR_BORDER_COLORS = [
	'#6F42C1', // Purple
	'#D94145', // Red
	'#FBBF24', // Orange
	'#FF35EE', // Magenta
	'#879F11', // Olive
	'#0F766E', // Teal
	'#00CFFF', // Cyan
];

/**
 * Gets the border color for an avatar based on the user ID.
 *
 * Always returns a 6-digit `#RRGGBB` hex string; callers (e.g. the highlight
 * styles) rely on this format to append alpha suffixes.
 *
 * @param userId The user ID.
 * @return The border color as a `#RRGGBB` hex string.
 */
export function getAvatarBorderColor( userId: number ): string {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}

/**
 * Generates a note excerpt from text based on word count type and length.
 *
 * @param text          The note text to generate excerpt from.
 * @param excerptLength The maximum length for the note excerpt.
 * @return The generated note excerpt.
 */
export function getNoteExcerpt(
	text: string | null | undefined,
	excerptLength: number = 10
): string {
	if ( ! text ) {
		return '';
	}

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	const rawText = text.trim();
	let trimmedExcerpt = '';

	if ( wordCountType === 'words' ) {
		trimmedExcerpt = rawText.split( ' ', excerptLength ).join( ' ' );
	} else if ( wordCountType === 'characters_excluding_spaces' ) {
		/*
		 * 1. Split the text at the character limit,
		 * then join the substrings back into one string.
		 * 2. Count the number of spaces in the text
		 * by comparing the lengths of the string with and without spaces.
		 * 3. Add the number to the length of the visible excerpt,
		 * so that the spaces are excluded from the word count.
		 */
		const textWithSpaces = rawText.split( '', excerptLength ).join( '' );

		const numberOfSpaces =
			textWithSpaces.length - textWithSpaces.replaceAll( ' ', '' ).length;

		trimmedExcerpt = rawText
			.split( '', excerptLength + numberOfSpaces )
			.join( '' );
	} else if ( wordCountType === 'characters_including_spaces' ) {
		trimmedExcerpt = rawText.split( '', excerptLength ).join( '' );
	}

	const isTrimmed = trimmedExcerpt !== rawText;
	return isTrimmed ? trimmedExcerpt + '…' : trimmedExcerpt;
}

/**
 * Normalizes noteId metadata to always return an array of unique numeric ids,
 * preserving insertion order. Handles both scalar (legacy, possibly
 * string-typed) and array (new) values.
 *
 * @param metadata Block metadata object
 * @return Array of note IDs (may be empty)
 */
export function getNoteIdsFromMetadata(
	metadata: BlockAttributes | null | undefined
): number[] {
	const noteId = metadata?.noteId;
	const raw = Array.isArray( noteId ) ? noteId : [ noteId ];
	const ids = new Set< number >();
	for ( const value of raw ) {
		const id = Number( value );
		if ( Number.isFinite( id ) && id > 0 ) {
			ids.add( id );
		}
	}
	return [ ...ids ];
}

/**
 * Adds a note ID to the metadata.
 * Converts scalar to array if needed, otherwise appends.
 *
 * @param metadata Existing block metadata
 * @param noteId   Note ID to add
 * @return Updated metadata object
 */
export function addNoteIdToMetadata(
	metadata: BlockAttributes | null | undefined,
	noteId: number | string
): BlockAttributes {
	const ids = new Set( getNoteIdsFromMetadata( metadata ) );
	const id = Number( noteId );
	if ( ids.has( id ) ) {
		return metadata as BlockAttributes;
	}
	ids.add( id );
	return { ...metadata, noteId: [ ...ids ] };
}

const NOTE_FORMAT_TYPE = 'core/note';

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
	noteId: number | string | null | undefined
): { start: number; end: number } | null {
	if ( noteId === undefined || noteId === null ) {
		return null;
	}
	let html = null;
	if ( value instanceof RichTextData ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( ! html || html.indexOf( 'wp-note' ) === -1 ) {
		return null;
	}
	const target = String( noteId );
	const record = create( { html } );
	const formats = record.formats;
	let start = -1;
	for ( let i = 0; i < formats.length; i++ ) {
		// Format runs are stored sparsely: unformatted positions hold
		// `undefined` even though the declared type doesn't say so.
		const stack = formats[ i ] as NoteMarkerFormat[] | undefined;
		const hit = stack?.find(
			( f ) =>
				f.type === NOTE_FORMAT_TYPE &&
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
	noteId: number | string | null | undefined
): { attributeKey: string; start: number; end: number } | null {
	if ( ! attributes ) {
		return null;
	}
	for ( const attributeKey of Object.keys( attributes ) ) {
		const range = findNoteRange( attributes[ attributeKey ], noteId );
		if ( range ) {
			return { attributeKey, start: range.start, end: range.end };
		}
	}
	return null;
}

/**
 * Build the CSS selector matching a note's in-content `core/note` marker in
 * the editor canvas. The format serializes as `<mark class="wp-note">` with
 * the note id in `data-id`.
 *
 * @param noteId Note id the marker carries.
 * @return Selector for the note's marker element(s).
 */
export function getNoteMarkerSelector( noteId: number | string ): string {
	/*
	 * `noteId` is a server comment ID (always a positive integer), but the
	 * value composes a selector from stored data, so escape it defensively.
	 *
	 * Deliberately not `CSS.escape`: that escapes for *identifier* context,
	 * where a leading digit is illegal, so it renders the id 7 as `\37 `.
	 * That is valid, and matches, but it makes every rule
	 * `buildHighlightCss` generates unreadable. Inside a quoted attribute
	 * value the only characters that need escaping are the quote, the
	 * backslash, and raw line breaks (a parse error in a CSS string).
	 */
	const escapedId = String( noteId ).replace( /["\\\n\r\f]/g, ( char ) =>
		char === '"' || char === '\\'
			? `\\${ char }`
			: `\\${ char.codePointAt( 0 )!.toString( 16 ) } `
	);
	return `mark.wp-note[data-id="${ escapedId }"]`;
}

/**
 * Measure the bounding rect of the current text selection within a block
 * element, or return null when there is no usable selection (collapsed, or
 * not fully inside the block). A pending new note has no in-content marker
 * yet, so the selection it will attach to is the only anchor available for
 * positioning its floating form.
 *
 * @param blockEl Block DOM element to resolve the selection in.
 * @return Selection rect, or null.
 */
export function getSelectionRect( blockEl: HTMLElement ): DOMRect | null {
	const selection = blockEl.ownerDocument.defaultView?.getSelection();
	if ( ! selection || selection.rangeCount === 0 || selection.isCollapsed ) {
		return null;
	}
	const range = selection.getRangeAt( 0 );
	// `isCollapsed` can be false with a collapsed first range, and
	// `getRectangleFromRange` measures those by inserting a temporary node.
	if ( range.collapsed ) {
		return null;
	}
	if ( ! blockEl.contains( range.commonAncestorContainer ) ) {
		return null;
	}
	// `getRectangleFromRange` over `Range.getBoundingClientRect()`: it drops
	// the hairline rects a selection picks up at a line's edge, so a
	// selection starting at the end of one line aligns to the line that
	// actually holds the text rather than to the line above it.
	const rect = getRectangleFromRange( range );
	// A range with no rendered client rects still yields an all-zero rect
	// rather than null, which would pin the thread to the top of the canvas.
	// Treat it as "no usable selection" so callers fall back to the block.
	if ( ! rect || ( rect.width === 0 && rect.height === 0 ) ) {
		return null;
	}
	return rect;
}

// Sentinel that sorts a block-level (whole-block) note before any inline note
// within the same block. Negative so any real character offset (>= 0) ranks
// after it. Number.NEGATIVE_INFINITY would work too; -1 is enough and keeps
// the diff arithmetic in safe integers.
export const BLOCK_LEVEL_NOTE_START = -1;

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
	thread: { id?: number | string } | null | undefined,
	attributes: BlockAttributes | null | undefined
): number {
	const found = findNoteInBlock( attributes, thread?.id );
	return found ? found.start : BLOCK_LEVEL_NOTE_START;
}

/**
 * Find a block's primary editable rich-text attribute by detecting the first
 * attribute whose value is a `RichTextData` instance. Rich-text (`source:
 * 'rich-text'`) attributes hydrate to `RichTextData` at runtime, so this avoids
 * block-type introspection and naturally only returns an attribute that
 * `wrapInlineNote` can actually mark. Used to locate the attribute to mark on an
 * interior block that a multi-block note selection fully covers.
 *
 * @param attributes Block attributes.
 * @return Attribute key, or null when the block has no rich-text field.
 */
export function findRichTextAttributeKey(
	attributes: BlockAttributes | null | undefined
): string | null {
	if ( ! attributes ) {
		return null;
	}
	for ( const key of Object.keys( attributes ) ) {
		if ( attributes[ key ] instanceof RichTextData ) {
			return key;
		}
	}
	return null;
}

/**
 * Character length of a rich-text attribute value (RichTextData or HTML string),
 * i.e. the number of markable positions. Returns 0 for non-text values.
 *
 * @param value Block attribute value.
 * @return Text length.
 */
export function getAttributeTextLength( value: unknown ): number {
	let html = null;
	if ( value instanceof RichTextData ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null ) {
		return 0;
	}
	return create( { html } ).text.length;
}

/**
 * Read a cross-block text selection as an ordered list of per-block segments
 * describing where a shared `core/note` marker should be applied. The block
 * editor's selection state is the only primitive that expresses a range from an
 * offset in one block to an offset in another; this turns it into concrete
 * per-block ranges (document order):
 * - first block: from the caret offset to the end of its attribute,
 * - interior blocks: their whole primary rich-text attribute,
 * - last block: from 0 to the caret offset.
 *
 * A block with no rich-text attribute (e.g. an image caught mid-range) yields a
 * segment with `attributeKey: null` so it still gets a block-level metadata
 * anchor but no marker. Boundary blocks whose range is empty (caret at the very
 * edge) degrade the same way.
 *
 * Returns `null` for collapsed or single-block selections (the caller handles
 * those via `readInlineSelection`) and for selections spanning different roots
 * (`getSelectedBlockClientIds` is empty across roots).
 *
 * @param selectors                           Block-editor selectors.
 * @param selectors.getSelectionStart         Block-editor selector.
 * @param selectors.getSelectionEnd           Block-editor selector.
 * @param selectors.getSelectedBlockClientIds Ordered client ids in the selection.
 * @param selectors.getBlockAttributes        Block-editor selector.
 * @return Ordered segments or null.
 */
export function readMultiBlockSelection( {
	getSelectionStart,
	getSelectionEnd,
	getSelectedBlockClientIds,
	getBlockAttributes,
}: MultiBlockSelectionSelectors ): NoteSegment[] | null {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		! end?.clientId ||
		start.clientId === end.clientId
	) {
		return null;
	}

	const clientIds = getSelectedBlockClientIds();
	if ( ! clientIds || clientIds.length < 2 ) {
		return null;
	}

	// The selection may run bottom-to-top; align the endpoints to document order
	// so `head` belongs to the first block and `tail` to the last.
	const firstId = clientIds[ 0 ];
	const head = start.clientId === firstId ? start : end;
	const tail = start.clientId === firstId ? end : start;

	const segments: NoteSegment[] = [];
	for ( let i = 0; i < clientIds.length; i++ ) {
		const clientId = clientIds[ i ];
		const isFirst = i === 0;
		const isLast = i === clientIds.length - 1;
		const attributes = getBlockAttributes( clientId );

		let attributeKey: string | null | undefined;
		if ( isFirst && head.attributeKey ) {
			attributeKey = head.attributeKey;
		} else if ( isLast && tail.attributeKey ) {
			attributeKey = tail.attributeKey;
		} else {
			attributeKey = findRichTextAttributeKey( attributes );
		}

		const blockLevel = {
			clientId,
			attributeKey: null,
			start: null,
			end: null,
		};
		if ( ! attributeKey ) {
			segments.push( blockLevel );
			continue;
		}

		const length = getAttributeTextLength( attributes?.[ attributeKey ] );
		const segStart =
			isFirst && head.offset !== undefined
				? Math.min( head.offset, length )
				: 0;
		const segEnd =
			isLast && tail.offset !== undefined
				? Math.min( tail.offset, length )
				: length;

		// Empty range (caret sat at a block edge): anchor at the block level.
		if ( segEnd <= segStart ) {
			segments.push( blockLevel );
			continue;
		}
		segments.push( {
			clientId,
			attributeKey,
			start: segStart,
			end: segEnd,
		} );
	}
	return segments;
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
 * its full range. The returned record is not normalised; callers should
 * round-trip it (e.g. through `RichTextData`) before storing.
 *
 * @param record A rich-text record (`{ text, formats, … }`).
 * @param format The `core/note` format to add (`{ type, attributes }`).
 * @param start  Range start (inclusive).
 * @param end    Range end (exclusive).
 * @return A new record with the note applied.
 */
export function applyNoteFormat(
	record: RichTextValue,
	format: NoteMarkerFormat,
	start: number,
	end: number
): RichTextValue {
	const formats = record.formats.slice();
	for ( let i = start; i < end; i++ ) {
		// Format runs are stored sparsely: unformatted positions hold
		// `undefined` even though the declared type doesn't say so.
		const stack =
			( formats[ i ] as NoteMarkerFormat[] | undefined )?.slice() ?? [];
		stack.push( format );
		formats[ i ] = stack;
	}

	// Measure each note's full span so containment can order the markers.
	const spans = new Map<
		string | undefined,
		{ start: number; end: number }
	>();
	for ( let i = 0; i < formats.length; i++ ) {
		const stack = formats[ i ] as NoteMarkerFormat[] | undefined;
		if ( ! stack ) {
			continue;
		}
		for ( const fmt of stack ) {
			if ( fmt.type !== NOTE_FORMAT_TYPE ) {
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
		const stack = formats[ i ] as NoteMarkerFormat[] | undefined;
		if ( ! stack || stack.length < 2 ) {
			continue;
		}
		const notes = stack.filter( ( fmt ) => fmt.type === NOTE_FORMAT_TYPE );
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
		const others = stack.filter( ( fmt ) => fmt.type !== NOTE_FORMAT_TYPE );
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
 * @return A new value with the marker removed, or null when the
 *         attribute isn't rich text or carries no such marker.
 */
export function removeNoteFormat(
	value: unknown,
	noteId: number | string
): RichTextData | null {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const target = String( noteId );
	const record = create( { html: value.toHTMLString() } );
	let changed = false;
	// Format runs are stored sparsely (`undefined` at unformatted positions)
	// even though the declared type doesn't say so; preserve the holes.
	const formats = record.formats.map(
		( stack: NoteMarkerFormat[] | undefined ) => {
			if ( ! stack ) {
				return stack;
			}
			const filtered = stack.filter(
				( format ) =>
					! (
						format.type === NOTE_FORMAT_TYPE &&
						format.attributes?.[ 'data-id' ] === target
					)
			);
			if ( filtered.length === stack.length ) {
				return stack;
			}
			changed = true;
			return filtered.length ? filtered : undefined;
		}
	) as RichTextValue[ 'formats' ];
	// Round-trip through HTML so the stored value matches a fresh reload.
	return changed
		? RichTextData.fromHTMLString(
				toHTMLString( { value: { ...record, formats } } )
		  )
		: null;
}

/**
 * Picks the most relevant thread from a list: first unresolved, else first.
 *
 * @param threads Ordered list of thread objects.
 * @return Selected thread or null when the list is empty.
 */
export function pickPrimaryNote( threads: Thread[] ): Thread | null {
	return (
		threads.find( ( thread ) => thread.status === 'hold' ) ??
		threads[ 0 ] ??
		null
	);
}

/**
 * Every thread anchored to a block, in list order.
 *
 * A note that spans several blocks lists its id in each of their
 * `metadata.noteId`, so its avatar indicator renders on all of them - but the
 * thread itself is anchored (and emitted) once, at the topmost block. Matching
 * on the anchor alone would therefore find nothing for the second and later
 * blocks of a multi-block note, so match against the full span and fall back to
 * the anchor for threads materialized without one.
 *
 * @param threads  Root threads to search.
 * @param clientId Block to find threads for.
 * @return Matching threads.
 */
export function getThreadsForBlock(
	threads: Thread[],
	clientId: string
): Thread[] {
	return threads.filter( ( thread ) =>
		thread.blockClientIds?.length
			? thread.blockClientIds.includes( clientId )
			: thread.blockClientId === clientId
	);
}

/**
 * Whether a note's spanned blocks are an unbroken run of siblings.
 *
 * The block editor's selection is a *range* - `multiSelect( first, last )`
 * takes in every sibling between the endpoints - so it can only express a
 * note's span faithfully when that span has no gaps. A gap appears when a block
 * is inserted between two spanned blocks, or when one block's `metadata.noteId`
 * is cleared while its neighbours keep theirs.
 *
 * @param clientIds                      Spanned blocks, in document order.
 * @param selectors                      Block editor selectors.
 * @param selectors.getBlockRootClientId
 * @param selectors.getBlockOrder
 * @return Whether the run can be multi-selected without over-selecting.
 */
function isContiguousSiblingRun(
	clientIds: string[],
	{
		getBlockRootClientId,
		getBlockOrder,
	}: {
		getBlockRootClientId: ( clientId: string ) => string | null;
		getBlockOrder: ( rootClientId?: string | null ) => string[];
	}
): boolean {
	const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
	if (
		clientIds.some(
			( clientId ) => getBlockRootClientId( clientId ) !== rootClientId
		)
	) {
		return false;
	}

	const order = getBlockOrder( rootClientId );
	const firstIndex = order.indexOf( clientIds[ 0 ] );
	if ( firstIndex === -1 ) {
		return false;
	}
	return clientIds.every(
		( clientId, i ) => order[ firstIndex + i ] === clientId
	);
}

/**
 * Selects the block or blocks a note is anchored to.
 *
 * A note that spans several blocks is multi-selected so that every block it
 * covers stays lit while the spotlight is on, rather than only the anchor.
 * Selection never moves focus into the canvas: `selectBlock` and `multiSelect`
 * both treat a `null` initial position as "don't focus".
 *
 * @param thread                       Root thread with `blockClientIds`.
 * @param actions                      Block editor actions and selectors.
 * @param actions.selectBlock
 * @param actions.multiSelect
 * @param actions.getBlockRootClientId Optional; enables the gap check.
 * @param actions.getBlockOrder        Optional; enables the gap check.
 */
export function selectNoteBlocks(
	thread: Thread,
	{
		selectBlock,
		multiSelect,
		getBlockRootClientId,
		getBlockOrder,
	}: {
		selectBlock: ( clientId: string, initialPosition?: unknown ) => void;
		multiSelect: (
			start: string,
			end: string,
			initialPosition?: unknown
		) => void;
		getBlockRootClientId?: ( clientId: string ) => string | null;
		getBlockOrder?: ( rootClientId?: string | null ) => string[];
	}
) {
	const clientIds = thread?.blockClientIds?.length
		? thread.blockClientIds
		: [ thread?.blockClientId ].filter(
				( id ): id is string => typeof id === 'string'
		  );

	if ( clientIds.length === 0 ) {
		return;
	}

	selectBlock( clientIds[ 0 ], null );

	if ( clientIds.length > 1 ) {
		/*
		 * `multiSelect` is a no-op when the blocks don't share a parent, in
		 * which case the anchor selected above remains the selection. When the
		 * span has a gap, selecting the range would light a block the note does
		 * not cover, so keep the anchor-only selection instead.
		 */
		if (
			getBlockRootClientId &&
			getBlockOrder &&
			! isContiguousSiblingRun( clientIds, {
				getBlockRootClientId,
				getBlockOrder,
			} )
		) {
			return;
		}
		multiSelect( clientIds[ 0 ], clientIds[ clientIds.length - 1 ], null );
	}
}

/**
 * Removes a note ID from the metadata.
 *
 * @param metadata Existing block metadata
 * @param noteId   Note ID to remove
 * @return Updated metadata object
 */
export function removeNoteIdFromMetadata(
	metadata: BlockAttributes | null | undefined,
	noteId: number | string
): BlockAttributes {
	const ids = new Set( getNoteIdsFromMetadata( metadata ) );
	ids.delete( Number( noteId ) );
	return {
		...metadata,
		noteId: ids.size > 0 ? [ ...ids ] : undefined,
	};
}

/**
 * Calculate final top positions for all floating note threads in the
 * editor's content coordinate space. Adjusts positions to prevent overlapping
 * by pushing threads above the selected one upward and threads below it downward.
 *
 * @param params
 * @param params.threads        Ordered list of thread objects.
 * @param params.selectedNoteId ID of the currently selected thread.
 * @param params.blockRects     Pre-read anchor rects keyed by thread ID.
 * @param params.heights        Rendered heights keyed by thread ID.
 * @param params.scrollTop      Current scroll offset of the editor content.
 * @return Computed top positions.
 */
export function calculateNotePositions( {
	threads,
	selectedNoteId,
	blockRects,
	heights,
	scrollTop = 0,
}: {
	threads: Thread[];
	selectedNoteId?: number | string;
	blockRects: Record< string, Pick< DOMRect, 'top' > >;
	heights: Record< string, number >;
	scrollTop?: number;
} ): { positions: Record< string, number > } {
	const offsets: Record< string, number > = {};

	// The overlap sweep walks outward from the anchor assuming each thread's
	// top is greater than the previous one's. Thread order is document order,
	// which tracks visual order for notes anchored to their markers, but a
	// pending "new" note anchors to the live selection and can therefore sit
	// above notes that precede it in the list. Sort by measured top so the
	// sweep's assumption holds and cards never displace past their markers.
	// Threads without a rect keep their relative order; they are skipped
	// below and never receive a position.
	const orderedThreads = [ ...threads ].sort(
		( a, b ) =>
			( blockRects[ a.id ]?.top ?? Number.MAX_VALUE ) -
			( blockRects[ b.id ]?.top ?? Number.MAX_VALUE )
	);

	const anchorIndex = Math.max(
		0,
		orderedThreads.findIndex( ( thread ) => thread.id === selectedNoteId )
	);

	const anchorThread = orderedThreads[ anchorIndex ];

	if ( ! anchorThread || ! blockRects[ anchorThread.id ] ) {
		return { positions: {} };
	}

	const anchorRect = blockRects[ anchorThread.id ];
	const anchorTop = anchorRect.top || 0;
	const anchorHeight = heights[ anchorThread.id ] || 0;

	offsets[ anchorThread.id ] = THREAD_ALIGN_OFFSET;

	// Process threads after the anchor, offsetting overlapping threads downward.
	let prevAdjustedTop = anchorTop + THREAD_ALIGN_OFFSET;
	let prevHeight = anchorHeight;

	for ( let i = anchorIndex + 1; i < orderedThreads.length; i++ ) {
		const thread = orderedThreads[ i ];
		const threadRect = blockRects[ thread.id ];
		if ( ! threadRect ) {
			continue;
		}

		const threadTop = threadRect.top || 0;
		const threadHeight = heights[ thread.id ] || 0;

		let offset = THREAD_ALIGN_OFFSET;

		const prevBottom = prevAdjustedTop + prevHeight;
		if ( threadTop < prevBottom + THREAD_GAP ) {
			offset = prevBottom - threadTop + OVERLAP_MARGIN;
		}

		offsets[ thread.id ] = offset;

		prevAdjustedTop = threadTop + offset;
		prevHeight = threadHeight;
	}

	// Process threads before the anchor, offsetting overlapping threads upward.
	let belowAdjustedTop = anchorTop + THREAD_ALIGN_OFFSET;

	for ( let i = anchorIndex - 1; i >= 0; i-- ) {
		const thread = orderedThreads[ i ];
		const threadRect = blockRects[ thread.id ];
		if ( ! threadRect ) {
			continue;
		}

		const threadTop = threadRect.top || 0;
		const threadHeight = heights[ thread.id ] || 0;

		let offset = THREAD_ALIGN_OFFSET;

		const threadBottom = threadTop + threadHeight;

		if ( threadBottom > belowAdjustedTop ) {
			offset =
				belowAdjustedTop - threadTop - threadHeight - OVERLAP_MARGIN;
		}

		offsets[ thread.id ] = offset;

		belowAdjustedTop = threadTop + offset;
	}

	// blockRect.top + scrollTop is the block's absolute y within the editor's
	// scroll content; CSS translates each thread by -scrollTop at render time.
	const positions: Record< string, number > = {};
	for ( const thread of orderedThreads ) {
		const blockRect = blockRects[ thread.id ];
		if ( blockRect && offsets[ thread.id ] !== undefined ) {
			positions[ thread.id ] =
				blockRect.top + scrollTop + offsets[ thread.id ];
		}
	}

	return { positions };
}

/**
 * Resolve the DOM element for a note thread once it's mounted,
 * or `null` if not found within 3 seconds.
 *
 * @param noteId             Note thread ID.
 * @param container          Container to search within.
 * @param additionalSelector Optional descendant selector.
 * @return Resolved element, or `null` on timeout.
 */
function findNoteThread(
	noteId: number | string | undefined,
	container: HTMLElement | null | undefined,
	additionalSelector?: string
): Promise< HTMLElement | null > {
	if ( ! container ) {
		return Promise.resolve( null );
	}

	// A thread without a noteId is a new note thread.
	const threadSelector =
		noteId && noteId !== 'new'
			? `[role=treeitem][id="note-thread-${ noteId }"]`
			: '[role=treeitem]:not([id])';
	const selector = additionalSelector
		? `${ threadSelector } ${ additionalSelector }`
		: threadSelector;

	return new Promise( ( resolve ) => {
		if ( container.querySelector( selector ) ) {
			return resolve(
				container.querySelector< HTMLElement >( selector )
			);
		}

		// `0` is a safe placeholder id: `clearTimeout` ignores unknown ids.
		let timer = 0;
		// Wait for the element to be added to the DOM.
		const observer = new window.MutationObserver( () => {
			if ( container.querySelector( selector ) ) {
				clearTimeout( timer );
				observer.disconnect();
				resolve( container.querySelector< HTMLElement >( selector ) );
			}
		} );

		observer.observe( container, { childList: true, subtree: true } );

		// Stop trying after 3 seconds.
		timer = window.setTimeout( () => {
			observer.disconnect();
			resolve( null );
		}, 3000 );
	} );
}

/**
 * Focus a note thread (or a descendant) and scroll it into view.
 *
 * @param noteId             Note thread ID.
 * @param container          Container to search within.
 * @param additionalSelector Optional descendant selector.
 */
export function focusNoteThread(
	noteId: number | string | undefined,
	container: HTMLElement | null | undefined,
	additionalSelector?: string
) {
	return findNoteThread( noteId, container, additionalSelector ).then(
		( element ) => {
			if ( ! element ) {
				return;
			}
			element.focus();
			element.scrollIntoView( { block: 'nearest' } );
		}
	);
}

/**
 * Scroll a note thread into view without changing focus.
 *
 * @param noteId    Note thread ID.
 * @param container Container to search within.
 */
export function scrollNoteThreadIntoView(
	noteId: number | string | undefined,
	container: HTMLElement | null | undefined
) {
	return findNoteThread( noteId, container ).then( ( element ) => {
		element?.scrollIntoView( { block: 'nearest' } );
	} );
}
