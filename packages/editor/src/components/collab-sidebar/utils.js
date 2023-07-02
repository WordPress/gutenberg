import { _x } from '@wordpress/i18n';
import { create, getActiveFormat, RichTextData } from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from './constants';

/**
 * Sanitizes a note string by trimming leading and trailing whitespace.
 *
 * @param {string} str - The note string to sanitize.
 * @return {string} - The sanitized note string.
 */
export function sanitizeNoteContent( str ) {
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
 * @param {number} userId - The user ID.
 * @return {string} - The border color as a `#RRGGBB` hex string.
 */
export function getAvatarBorderColor( userId ) {
	return AVATAR_BORDER_COLORS[ userId % AVATAR_BORDER_COLORS.length ];
}

/**
 * Generates a note excerpt from text based on word count type and length.
 *
 * @param {string} text          - The note text to generate excerpt from.
 * @param {number} excerptLength - The maximum length for the note excerpt.
 * @return {string} - The generated note excerpt.
 */
export function getNoteExcerpt( text, excerptLength = 10 ) {
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
 * @param {Object} metadata Block metadata object
 * @return {number[]} Array of note IDs (may be empty)
 */
export function getNoteIdsFromMetadata( metadata ) {
	const noteId = metadata?.noteId;
	const raw = Array.isArray( noteId ) ? noteId : [ noteId ];
	const ids = new Set();
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
 * @param {Object} metadata Existing block metadata
 * @param {number} noteId   Note ID to add
 * @return {Object} Updated metadata object
 */
export function addNoteIdToMetadata( metadata, noteId ) {
	const ids = new Set( getNoteIdsFromMetadata( metadata ) );
	const id = Number( noteId );
	if ( ids.has( id ) ) {
		return metadata;
	}
	ids.add( id );
	return { ...metadata, noteId: [ ...ids ] };
}

/**
 * Search a rich-text value for a `core/note` marker matching `noteId` and
 * return its character range. Used to derive an inline note's anchor from
 * the in-content marker (resilient to edits) rather than stale offset meta.
 *
 * @param {unknown}       value  Block attribute value (RichTextData, string, or other).
 * @param {number|string} noteId Note id to search for.
 * @return {?{start: number, end: number}} Range or null when no marker is found.
 */
export function findNoteRange( value, noteId ) {
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
 * Locate a note's in-content `core/note` marker across all of a block's
 * attributes. The marker (carrying `data-id`) is the single source of truth for
 * an inline note's anchor: a note is inline iff a marker with its id exists in
 * the block, and the attribute that holds it is discovered here rather than
 * stored separately. Returns the matching attribute key and the marker range.
 *
 * @param {?Object}       attributes Block attributes, or null/undefined when unloaded.
 * @param {number|string} noteId     Note id to search for.
 * @return {?{attributeKey: string, start: number, end: number}} Anchor or null when no marker is found.
 */
export function findNoteInBlock( attributes, noteId ) {
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
 * @param {number|string} noteId Note id the marker carries.
 * @return {string} Selector for the note's marker element(s).
 */
export function getNoteMarkerSelector( noteId ) {
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
			: `\\${ char.codePointAt( 0 ).toString( 16 ) } `
	);
	return `mark.wp-note[data-id="${ escapedId }"]`;
}

/**
 * Measure where a note's floating thread should line up in the canvas.
 *
 * An inline note anchors to its in-content marker, so the thread aligns with
 * the noted text rather than the block, and so does a pending new note through
 * its draft marker. A marker split into several runs (crossing overlaps)
 * resolves to its first run. Anything else falls back to the block itself. An
 * anchor inside collapsed content (e.g. a closed Details) falls back to the
 * closest visible block.
 *
 * Resolved at read time, because rich-text re-renders replace the marker.
 *
 * @param {number|string} noteId  Note id.
 * @param {HTMLElement}   blockEl Block element the note belongs to.
 * @return {DOMRect} Anchor rect, in viewport coordinates.
 */
export function getNoteAnchorRect( noteId, blockEl ) {
	let anchor =
		blockEl.querySelector( getNoteMarkerSelector( noteId ) ) ?? blockEl;
	// Collapsed content still reports the box it would have when expanded,
	// so its size can't tell it apart. Safari < 17.4 lacks `checkVisibility`.
	while ( anchor.checkVisibility?.() === false ) {
		const parentBlock = anchor.parentElement?.closest( '[data-block]' );
		if ( ! parentBlock ) {
			break;
		}
		anchor = parentBlock;
	}
	return anchor.getBoundingClientRect();
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
 * @param {Object}  thread     Materialized thread record (with `.id`).
 * @param {?Object} attributes Block attributes for the thread's block.
 * @return {number} Marker start offset, or `BLOCK_LEVEL_NOTE_START` when there is no inline anchor.
 */
export function getInlineMarkerStart( thread, attributes ) {
	const found = findNoteInBlock( attributes, thread?.id );
	return found ? found.start : BLOCK_LEVEL_NOTE_START;
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
 * @param {Object} record A rich-text record (`{ text, formats, … }`).
 * @param {Object} format The `core/note` format to add (`{ type, attributes }`).
 * @param {number} start  Range start (inclusive).
 * @param {number} end    Range end (exclusive).
 * @return {Object} A new record with the note applied.
 */
export function applyNoteFormat( record, format, start, end ) {
	const formats = record.formats.slice();
	for ( let i = start; i < end; i++ ) {
		const stack = formats[ i ] ? formats[ i ].slice() : [];
		stack.push( format );
		formats[ i ] = stack;
	}

	// Measure each note's full span so containment can order the markers.
	const spans = new Map();
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
	const sizeOf = ( id ) => {
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
 * @typedef {Object} WPSelectionPoint
 * @property {string} [clientId]     Selected block client id.
 * @property {string} [attributeKey] Selected rich-text attribute.
 * @property {number} [offset]       Offset within the attribute.
 */

/**
 * Read an inline selection from block-editor selection state, returning
 * normalized anchor data when a non-collapsed selection sits inside a single
 * rich-text attribute. Returns null for block-level or collapsed selections.
 *
 * @param {() => WPSelectionPoint} getSelectionStart Block-editor selector.
 * @param {() => WPSelectionPoint} getSelectionEnd   Block-editor selector.
 * @return {?{clientId: string, attributeKey: string, start: number, end: number}} Normalized selection or null.
 */
export function readInlineSelection( getSelectionStart, getSelectionEnd ) {
	const start = getSelectionStart();
	const end = getSelectionEnd();
	if (
		! start?.clientId ||
		start.clientId !== end.clientId ||
		! start.attributeKey ||
		start.offset === undefined ||
		end.offset === undefined ||
		start.offset === end.offset
	) {
		return null;
	}
	// Normalize direction so callers don't have to think about reversed ranges.
	const [ startOffset, endOffset ] =
		start.offset < end.offset
			? [ start.offset, end.offset ]
			: [ end.offset, start.offset ];
	return {
		clientId: start.clientId,
		attributeKey: start.attributeKey,
		start: startOffset,
		end: endOffset,
	};
}

/**
 * Wrap a rich-text range with a core/note marker. Returns a new
 * RichTextData ready to write back into block attributes, or null when the
 * incoming value isn't a rich-text instance (legacy/string attributes).
 *
 * @param {unknown} value Existing block attribute value.
 * @param {number}  id    New note id to embed as `data-id`.
 * @param {number}  start Range start offset.
 * @param {number}  end   Range end offset.
 * @return {?RichTextData} Wrapped value or null when the attribute isn't rich text.
 */
export function wrapInlineNote( value, id, start, end ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const record = applyNoteFormat(
		create( { html: value.toHTMLString() } ),
		{ type: NOTE_FORMAT_NAME, attributes: { 'data-id': String( id ) } },
		start,
		end
	);
	// Round-trip through HTML to normalise format references (applyNoteFormat
	// leaves them un-normalised) so the stored value matches a fresh reload.
	return RichTextData.fromHTMLString(
		new RichTextData( record ).toHTMLString()
	);
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
 * @param {unknown}       value  Block attribute value (RichTextData or other).
 * @param {number|string} noteId Note id whose marker should be removed.
 * @return {?RichTextData} A new value with the marker removed, or null when the
 *                         attribute isn't rich text or carries no such marker.
 */
export function removeNoteFormat( value, noteId ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const target = String( noteId );
	const record = create( { html: value.toHTMLString() } );
	let changed = false;
	const formats = record.formats.map( ( stack ) => {
		if ( ! stack ) {
			return stack;
		}
		const filtered = stack.filter(
			( format ) =>
				! (
					format.type === NOTE_FORMAT_NAME &&
					format.attributes?.[ 'data-id' ] === target
				)
		);
		if ( filtered.length === stack.length ) {
			return stack;
		}
		changed = true;
		return filtered.length ? filtered : undefined;
	} );
	// Round-trip through HTML so the stored value matches a fresh reload.
	return changed
		? RichTextData.fromHTMLString(
				new RichTextData( { ...record, formats } ).toHTMLString()
			)
		: null;
}

/**
 * Remove a note's inline `core/note` marker from block attributes.
 *
 * @param {?Object}       attributes Block attributes.
 * @param {number|string} noteId     Note id whose marker to remove.
 * @return {?{attributeKey: string, start: number, end: number, value: RichTextData}} Marker range and the new attribute value, or null when no marker.
 */
export function removeInlineNote( attributes, noteId ) {
	const found = findNoteInBlock( attributes, noteId );
	const value =
		found && removeNoteFormat( attributes[ found.attributeKey ], noteId );
	return value ? { ...found, value } : null;
}

let lastParsed = { html: null, formats: null };

/**
 * Formats of a rich-text attribute. A string is parsed only when it holds a
 * marker, and the last parse is cached: caret moves re-read the same string.
 *
 * @param {unknown} value Block attribute value.
 * @return {?Array} Formats array, or null when the value isn't rich text.
 */
function getFormats( value ) {
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
 * @param {string} id Marker `data-id`.
 * @return {number|string} Note id, or `'new'` for the draft marker.
 */
function toNoteId( id ) {
	return id === 'new' ? id : Number( id );
}

/**
 * Note whose marker covers the whole selection. A caret on a marker's edge is
 * outside, as for any inline format.
 *
 * @param {Object} attributes     Block attributes.
 * @param {Object} selectionStart Block-editor selection start.
 * @param {Object} selectionEnd   Block-editor selection end.
 * @return {number|string|undefined|null} Note id, `'new'` for the draft
 *                                        marker, undefined outside markers,
 *                                        or null when the caret is unknown.
 */
export function getNoteAtCaret( attributes, selectionStart, selectionEnd ) {
	const attributeKey = selectionStart?.attributeKey;
	const start = selectionStart?.offset;
	const end = selectionEnd?.offset;
	if (
		! attributeKey ||
		start === undefined ||
		end === undefined ||
		selectionEnd?.attributeKey !== attributeKey
	) {
		return null;
	}
	const formats = getFormats( attributes?.[ attributeKey ] );
	if ( ! formats ) {
		return undefined;
	}
	const value =
		start <= end
			? { formats, start, end }
			: { formats, start: end, end: start };
	const id = getActiveFormat( value, NOTE_FORMAT_NAME )?.attributes?.[
		'data-id'
	];
	return id ? toNoteId( id ) : undefined;
}

/**
 * Ids of the notes with a marker in the block, the draft marker's `'new'`
 * included.
 *
 * @param {Object} attributes Block attributes.
 * @return {Set<number|string>} Note ids.
 */
function getInlineNoteIds( attributes ) {
	const ids = new Set();
	for ( const value of Object.values( attributes ?? {} ) ) {
		getFormats( value )?.forEach( ( stack ) => {
			for ( const format of stack ?? [] ) {
				if ( format.type === NOTE_FORMAT_NAME ) {
					ids.add( toNoteId( format.attributes?.[ 'data-id' ] ) );
				}
			}
		} );
	}
	return ids;
}

/**
 * Note for a caret in the block but outside markers: the unsent draft, else a
 * block-level note (the selected one, else the primary), else none.
 *
 * @param {Object}                  props
 * @param {Object}                  props.attributes     Block attributes.
 * @param {Array}                   props.blockThreads   The block's threads.
 * @param {boolean}                 props.hasDraft       Whether the block has an unsent note draft.
 * @param {number|string|undefined} props.selectedNoteId Currently selected note.
 * @return {number|string|undefined} Note id, `'new'` for the draft form, or undefined.
 */
function getBlockNote( {
	attributes,
	blockThreads,
	hasDraft,
	selectedNoteId,
} ) {
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
 * @param {Object}                       props
 * @param {number|string|undefined|null} props.noteAtCaret    See `getNoteAtCaret`.
 * @param {boolean}                      props.isBlockChange  Whether the caret came from another block.
 * @param {Object}                       props.attributes     Block attributes.
 * @param {Array}                        props.blockThreads   The block's threads.
 * @param {boolean}                      props.hasDraft       Whether the block has an unsent note draft.
 * @param {number|string|undefined}      props.selectedNoteId Currently selected note.
 * @return {number|string|undefined} Note id, `'new'` for the draft form, or undefined.
 */
export function pickNoteForCaret( {
	noteAtCaret,
	isBlockChange,
	attributes,
	blockThreads,
	hasDraft,
	selectedNoteId,
} ) {
	// Enters a marker.
	if ( noteAtCaret ) {
		return noteAtCaret;
	}
	// Enters another block, or leaves the selected note's marker.
	if (
		isBlockChange ||
		( noteAtCaret === undefined &&
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
 * Whether focus is inside an element, in whichever document it lives.
 *
 * @param {?Element} element Element to check.
 * @return {boolean} True when the element contains the active element.
 */
export function hasFocusWithin( element ) {
	return !! element?.contains( element.ownerDocument.activeElement );
}

/**
 * Picks the most relevant thread from a list: first unresolved, else first.
 *
 * @param {Array} threads Ordered list of thread objects.
 * @return {Object|null} Selected thread or null when the list is empty.
 */
export function pickPrimaryNote( threads ) {
	return (
		threads.find( ( thread ) => thread.status === 'hold' ) ??
		threads[ 0 ] ??
		null
	);
}

/**
 * Removes a note ID from the metadata.
 *
 * @param {Object} metadata Existing block metadata
 * @param {number} noteId   Note ID to remove
 * @return {Object} Updated metadata object
 */
export function removeNoteIdFromMetadata( metadata, noteId ) {
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
 * @param {Object}                  params
 * @param {Array}                   params.threads        Ordered list of thread objects.
 * @param {string|number|undefined} params.selectedNoteId ID of the currently selected thread.
 * @param {Object<string,Object>}   params.blockRects     Anchor rects (`{ top }`) keyed by thread ID.
 * @param {Object<string,number>}   params.heights        Rendered heights keyed by thread ID.
 * @param {number}                  params.scrollTop      Current scroll offset of the editor content.
 * @return {{ positions: Object<string,number>, contentHeight: number }} Computed top positions, and the content height that fits every measured thread.
 */
export function calculateNotePositions( {
	threads,
	selectedNoteId,
	blockRects,
	heights,
	scrollTop = 0,
} ) {
	const offsets = {};

	// The overlap sweep walks outward from the anchor assuming each thread's
	// top is greater than the previous one's. Thread order is document order,
	// which tracks visual order for notes anchored to their markers, but a
	// pending "new" note anchors to the live selection and can therefore sit
	// above notes that precede it in the list. Sort by measured top so the
	// sweep's assumption holds and cards never displace past their markers.
	// Threads without a rect keep their relative order; they are skipped
	// below and never receive a position.
	const orderedThreads = threads.toSorted(
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
		return { positions: {}, contentHeight: 0 };
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
	// scroll content. The content height reaches a gap past the lowest
	// measured thread's box, which starts a THREAD_GAP (its top margin, the
	// one THREAD_ALIGN_OFFSET cancels) below its position.
	const positions = {};
	let contentHeight = 0;
	for ( const thread of orderedThreads ) {
		const blockRect = blockRects[ thread.id ];
		if ( blockRect && offsets[ thread.id ] !== undefined ) {
			const top = blockRect.top + scrollTop + offsets[ thread.id ];
			positions[ thread.id ] = top;
			if ( heights[ thread.id ] ) {
				contentHeight = Math.max(
					contentHeight,
					top + THREAD_GAP + heights[ thread.id ] + THREAD_GAP
				);
			}
		}
	}

	return { positions, contentHeight };
}

/**
 * Resolve the DOM element for a note thread once it's mounted,
 * or `null` if not found within 3 seconds.
 *
 * @param {string}       noteId             Note thread ID.
 * @param {?HTMLElement} container          Container to search within.
 * @param {string}       additionalSelector Optional descendant selector.
 * @return {Promise<HTMLElement|null>} Resolved element, or `null` on timeout.
 */
function findNoteThread( noteId, container, additionalSelector ) {
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
			return resolve( container.querySelector( selector ) );
		}

		let timer = null;
		// Wait for the element to be added to the DOM.
		const observer = new window.MutationObserver( () => {
			if ( container.querySelector( selector ) ) {
				clearTimeout( timer );
				observer.disconnect();
				resolve( container.querySelector( selector ) );
			}
		} );

		observer.observe( container, { childList: true, subtree: true } );

		// Stop trying after 3 seconds.
		timer = setTimeout( () => {
			observer.disconnect();
			resolve( null );
		}, 3000 );
	} );
}

/**
 * Focus a note thread (or a descendant) and scroll it into view.
 *
 * @param {string}       noteId             Note thread ID.
 * @param {?HTMLElement} container          Container to search within.
 * @param {string}       additionalSelector Optional descendant selector.
 */
export function focusNoteThread( noteId, container, additionalSelector ) {
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
 * @param {string}       noteId    Note thread ID.
 * @param {?HTMLElement} container Container to search within.
 */
export function scrollNoteThreadIntoView( noteId, container ) {
	return findNoteThread( noteId, container ).then( ( element ) => {
		element?.scrollIntoView( { block: 'nearest' } );
	} );
}
