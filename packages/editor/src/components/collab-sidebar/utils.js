/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Sanitizes a comment string by removing non-printable ASCII characters.
 *
 * @param {string} str - The comment string to sanitize.
 * @return {string} - The sanitized comment string.
 */
export function sanitizeCommentString( str ) {
	return str.trim();
}

const THREAD_ALIGN_OFFSET = -16;
const THREAD_GAP = 16;
const OVERLAP_MARGIN = 20;
const BOARD_BOTTOM_PADDING = 32;

/**
 * Avatar border colors chosen to be visually distinct from each other and from
 * the editor's semantic UI colors (Delta E > 10 between all pairs).
 */
const AVATAR_BORDER_COLORS = [
	'#C36EFF', // Purple
	'#FF51A8', // Pink
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
 * Generates a comment excerpt from text based on word count type and length.
 *
 * @param {string} text          - The comment text to generate excerpt from.
 * @param {number} excerptLength - The maximum length for the commentexcerpt.
 * @return {string} - The generated comment excerpt.
 */
export function getCommentExcerpt( text, excerptLength = 10 ) {
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
 * Calculate y offsets for all floating comment threads. Adjusts positions
 * to prevent overlapping by pushing threads above the selected one upward
 * and threads below it downward.
 *
 * @param {Object}                  params
 * @param {Array}                   params.threads        Ordered list of thread objects.
 * @param {string|number|undefined} params.selectedNoteId ID of the currently selected thread.
 * @param {Object<string,DOMRect>}  params.blockRects     Pre-read bounding rects keyed by thread ID.
 * @param {Object<string,number>}   params.heights        Rendered heights keyed by thread ID.
 * @return {{ offsets: Object<string,number>, minHeight: number }} Computed offsets and minimum editor height.
 */
export function calculateAllOffsets( {
	threads,
	selectedNoteId,
	blockRects,
	heights,
} ) {
	const offsets = {};

	const anchorIndex = Math.max(
		0,
		threads.findIndex( ( thread ) => thread.id === selectedNoteId )
	);

	const anchorThread = threads[ anchorIndex ];

	if ( ! anchorThread || ! blockRects[ anchorThread.id ] ) {
		return { offsets, minHeight: 0 };
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

	let editorMinHeight = 0;
	const lastThread = threads[ threads.length - 1 ];
	const lastBlockRect = blockRects[ lastThread.id ];
	if ( lastBlockRect ) {
		const lastThreadTop = lastBlockRect.top || 0;
		const lastThreadHeight = heights[ lastThread.id ] || 0;
		const lastThreadOffset = offsets[ lastThread.id ] || 0;
		editorMinHeight =
			lastThreadTop +
			lastThreadHeight +
			lastThreadOffset +
			BOARD_BOTTOM_PADDING;
	}

	return { offsets, minHeight: editorMinHeight };
}

/**
 * Shift focus to the comment thread associated with a particular comment ID.
 * If an additional selector is provided, the focus will be shifted to the element matching the selector.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @param {string}       commentId          The ID of the comment thread to focus.
 * @param {?HTMLElement} container          The container element to search within.
 * @param {string}       additionalSelector The additional selector to focus on.
 */
export function focusCommentThread( commentId, container, additionalSelector ) {
	if ( ! container ) {
		return;
	}

	// A thread without a commentId is a new comment thread.
	const threadSelector =
		commentId && commentId !== 'new'
			? `[role=treeitem][id="comment-thread-${ commentId }"]`
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

		observer.observe( container, {
			childList: true,
			subtree: true,
		} );

		// Stop trying after 3 seconds.
		timer = setTimeout( () => {
			observer.disconnect();
			resolve( null );
		}, 3000 );
	} ).then( ( element ) => element?.focus() );
}
