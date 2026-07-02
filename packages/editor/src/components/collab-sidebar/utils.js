/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { create, RichTextData } from '@wordpress/rich-text';

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
	'#C36EFF', // Purple
	'#D94145', // Red
	'#E4780A', // Orange
	'#FF35EE', // Magenta
	'#879F11', // Olive
	'#46A494', // Teal
	'#00A2C3', // Cyan
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

const NOTE_FORMAT_TYPE = 'core/note';

/**
 * Search a rich-text value for a `core/note` marker matching `noteId` and
 * return its character range. Used to derive an inline note's anchor from
 * the in-content marker (resilient to edits) rather than stale offset meta.
 *
 * @param {*}             value  Block attribute value (RichTextData, string, or other).
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
 * @param {*}             value  Block attribute value (RichTextData or other).
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
					format.type === NOTE_FORMAT_TYPE &&
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
 * @param {Object<string,DOMRect>}  params.blockRects     Pre-read bounding rects keyed by thread ID.
 * @param {Object<string,number>}   params.heights        Rendered heights keyed by thread ID.
 * @param {number}                  params.scrollTop      Current scroll offset of the editor content.
 * @return {{ positions: Object<string,number> }} Computed top positions.
 */
export function calculateNotePositions( {
	threads,
	selectedNoteId,
	blockRects,
	heights,
	scrollTop = 0,
} ) {
	const offsets = {};

	const anchorIndex = Math.max(
		0,
		threads.findIndex( ( thread ) => thread.id === selectedNoteId )
	);

	const anchorThread = threads[ anchorIndex ];

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

	for ( let i = anchorIndex + 1; i < threads.length; i++ ) {
		const thread = threads[ i ];
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
		const thread = threads[ i ];
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
	const positions = {};
	for ( const thread of threads ) {
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
