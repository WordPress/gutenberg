/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Sanitizes a note string by removing non-printable ASCII characters.
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
 * @param {number} userId - The user ID.
 * @return {string} - The border color.
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
