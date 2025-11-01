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

/**
 * A no-operation function that does nothing.
 */
export function noop() {}

/**
 * These colors are picked from the WordPress.org design library.
 * @see https://www.figma.com/design/HOJTpCFfa3tR0EccUlu0CM/WordPress.org-Design-Library?node-id=1-2193&t=M6WdRvTpt0mh8n6T-1
 */
const AVATAR_BORDER_COLORS = [
	'#3858E9', // Blueberry
	'#9fB1FF', // Blueberry 2
	'#1D35B4', // Dark Blueberry
	'#1A1919', // Charcoal 0
	'#E26F56', // Pomegranate
	'#33F078', // Acid Green
	'#FFF972', // Lemon
	'#7A00DF', // Purple
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
	const threadSelector = commentId
		? `[role=listitem][id="comment-thread-${ commentId }"]`
		: '[role=listitem]:not([id])';
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
